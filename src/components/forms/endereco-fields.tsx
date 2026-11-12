"use client"

import { useState } from "react"
import { Controller, type Control, type FieldValues, type Path, type PathValue, type UseFormSetValue } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { maskCepInput, onlyDigits } from "~/lib/utils"
import { getEnderecoPorCep } from "~/services/cep"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"

const texto = (max: number) => z.string().trim().max(max, `No máximo ${max} caracteres.`)

/** Espelha os `check` de endereço de `profiles` e do `pedidos_criar`. Obrigatoriedade fica com quem usa. */
export const enderecoSchema = z.object({
    cep: z.string().refine((value) => [0, 8].includes(onlyDigits(value).length), "CEP com 8 dígitos."),
    logradouro: texto(LIMITS.LOGRADOURO),
    numero: texto(LIMITS.NUMERO),
    complemento: texto(LIMITS.COMPLEMENTO),
    bairro: texto(LIMITS.BAIRRO),
    cidade: texto(LIMITS.CIDADE),
    uf: z
        .string()
        .trim()
        .refine((value) => value === "" || /^[A-Za-z]{2}$/.test(value), "UF com 2 letras."),
})

export type EnderecoFormValues = z.infer<typeof enderecoSchema>

export const ENDERECO_VAZIO: EnderecoFormValues = {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
}

/** Rua, número, bairro e cidade: o mínimo que o `pedidos_criar` exige para entregar. */
export function isEnderecoCompleto(endereco: EnderecoFormValues) {
    return Boolean(endereco.logradouro.trim() && endereco.numero.trim() && endereco.bairro.trim() && endereco.cidade.trim())
}

type EnderecoFieldsProps<T extends FieldValues> = {
    control: Control<T>
    setValue: UseFormSetValue<T>
    /** Caminho do objeto de endereço dentro do form (ex.: "endereco"). */
    name: string
    /** Prefixo dos ids, no padrão `<form>-<campo>`. */
    idPrefix: string
    disabled?: boolean
}

/**
 * Os campos de endereço, com o CEP preenchendo rua, bairro, cidade e UF (ViaCEP). Usado no
 * checkout e em Meus dados.
 */
export function EnderecoFields<T extends FieldValues>({ control, setValue, name, idPrefix, disabled }: EnderecoFieldsProps<T>) {
    const queryClient = useQueryClient()
    const [buscandoCep, setBuscandoCep] = useState(false)
    const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false)

    const path = (campo: keyof EnderecoFormValues) => `${name}.${campo}` as Path<T>

    function preencher(campo: keyof EnderecoFormValues, valor: string) {
        if (valor) setValue(path(campo), valor as PathValue<T, Path<T>>, { shouldValidate: true })
    }

    async function buscarCep(cep: string) {
        setCepNaoEncontrado(false)
        if (onlyDigits(cep).length !== 8) return

        setBuscandoCep(true)
        try {
            const endereco = await queryClient.fetchQuery({
                queryKey: [QUERIES.GET_CEP, { cep: onlyDigits(cep) }],
                queryFn: () => getEnderecoPorCep({ cep }),
                staleTime: Number.POSITIVE_INFINITY,
            })

            if (!endereco) {
                setCepNaoEncontrado(true)
                return
            }

            preencher("logradouro", endereco.logradouro)
            preencher("bairro", endereco.bairro)
            preencher("cidade", endereco.cidade)
            preencher("uf", endereco.uf)
        } catch {
            // Sem internet ou ViaCEP fora do ar: o cliente digita o endereço à mão.
        } finally {
            setBuscandoCep(false)
        }
    }

    function campo(
        campoNome: keyof EnderecoFormValues,
        label: string,
        props: React.ComponentProps<typeof Input> & { description?: string } = {}
    ) {
        const { description, className, ...inputProps } = props

        return (
            <Controller
                name={path(campoNome)}
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className={className}>
                        <FieldLabel htmlFor={`${idPrefix}-${campoNome}`}>{label}</FieldLabel>
                        <Input
                            {...field}
                            {...inputProps}
                            id={`${idPrefix}-${campoNome}`}
                            size="xl"
                            disabled={disabled}
                            aria-invalid={fieldState.invalid}
                        />
                        {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
        )
    }

    return (
        <div className="grid grid-cols-6 gap-4">
            <Controller
                name={path("cep")}
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="col-span-6 sm:col-span-3">
                        <FieldLabel htmlFor={`${idPrefix}-cep`}>CEP</FieldLabel>
                        <div className="relative">
                            <Input
                                {...field}
                                id={`${idPrefix}-cep`}
                                size="xl"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                placeholder="00000-000"
                                disabled={disabled}
                                aria-invalid={fieldState.invalid}
                                onChange={(event) => {
                                    const valor = maskCepInput(event.target.value)

                                    field.onChange(valor)
                                    buscarCep(valor)
                                }}
                            />
                            {buscandoCep && (
                                <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                            )}
                        </div>
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <FieldDescription>
                                {cepNaoEncontrado ? "CEP não encontrado. Preencha o endereço abaixo." : "Preenche a rua e o bairro."}
                            </FieldDescription>
                        )}
                    </Field>
                )}
            />
            {campo("logradouro", "Rua", {
                className: "col-span-6",
                autoComplete: "address-line1",
                placeholder: "Rua, avenida...",
                maxLength: LIMITS.LOGRADOURO,
            })}
            {campo("numero", "Número", {
                className: "col-span-2",
                inputMode: "text",
                maxLength: LIMITS.NUMERO,
            })}
            {campo("complemento", "Complemento", {
                className: "col-span-4",
                autoComplete: "address-line2",
                placeholder: "Apto, bloco, referência",
                maxLength: LIMITS.COMPLEMENTO,
            })}
            {campo("bairro", "Bairro", {
                className: "col-span-6 sm:col-span-3",
                maxLength: LIMITS.BAIRRO,
            })}
            {campo("cidade", "Cidade", {
                className: "col-span-4 sm:col-span-2",
                autoComplete: "address-level2",
                maxLength: LIMITS.CIDADE,
            })}
            {campo("uf", "UF", {
                className: "col-span-2 sm:col-span-1",
                autoComplete: "address-level1",
                maxLength: 2,
            })}
        </div>
    )
}

/** Valores do form → colunas do banco (vazio vira null; CEP só dígitos; UF maiúscula). */
export function toEnderecoInput(endereco: EnderecoFormValues) {
    const valor = (texto: string) => (texto.trim() === "" ? null : texto.trim())

    return {
        cep: valor(onlyDigits(endereco.cep)),
        logradouro: valor(endereco.logradouro),
        numero: valor(endereco.numero),
        complemento: valor(endereco.complemento),
        bairro: valor(endereco.bairro),
        cidade: valor(endereco.cidade),
        uf: valor(endereco.uf.toUpperCase()),
    }
}
