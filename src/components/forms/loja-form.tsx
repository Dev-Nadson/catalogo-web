"use client"

import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS } from "~/lib/constants"
import { maskPhoneInput, onlyDigits } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { ImageUploadField } from "~/components/image-upload-field"

const opcional = (max: number) => z.string().trim().max(max, `No máximo ${max} caracteres.`)

/** Espelha os `check` de `configuracoes` no `schema.sql`. */
const lojaSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe o nome da loja.")
        .max(LIMITS.LOJA_NOME, `No máximo ${LIMITS.LOJA_NOME} caracteres.`),
    slogan: opcional(LIMITS.LOJA_SLOGAN),
    cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use o formato #RRGGBB."),
    whatsapp: z
        .string()
        .refine((value) => value === "" || /^\d{10,11}$/.test(onlyDigits(value)), "Número com DDD."),
    instagram: z
        .string()
        .trim()
        .refine((value) => value === "" || /^@?[A-Za-z0-9._]{1,30}$/.test(value), "Só o usuário, ex.: @minhaloja."),
    endereco: opcional(LIMITS.LOJA_ENDERECO),
    horario: opcional(LIMITS.LOJA_HORARIO),
    aviso: opcional(LIMITS.LOJA_AVISO),
    /** Data URL do logo novo, já comprimido. */
    logo: z.string().nullable(),
    removerLogo: z.boolean(),
})

export type LojaFormValues = z.infer<typeof lojaSchema>

type TextFieldProps = {
    control: Control<LojaFormValues>
    name: "nome" | "slogan" | "instagram" | "endereco"
    label: string
    placeholder?: string
    description?: string
    maxLength: number
    disabled: boolean
}

function TextField({ control, name, label, placeholder, description, maxLength, disabled }: TextFieldProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`loja-${name}`}>{label}</FieldLabel>
                    <Input
                        {...field}
                        id={`loja-${name}`}
                        size="xl"
                        maxLength={maxLength}
                        placeholder={placeholder}
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

type LojaFormProps = {
    defaultValues: LojaFormValues
    /** Link público do logo atual. */
    logoUrl: string | null
    isPending: boolean
    onSubmit: (values: LojaFormValues) => void
}

export function LojaForm({ defaultValues, logoUrl, isPending, onSubmit }: LojaFormProps) {
    const form = useForm<LojaFormValues>({
        resolver: zodResolver(lojaSchema),
        defaultValues,
    })

    const removerLogo = useWatch({ control: form.control, name: "removerLogo" })
    const fieldProps = { control: form.control, disabled: isPending }

    return (
        <form id="loja-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
                <TextField {...fieldProps} name="nome" label="Nome da loja" maxLength={LIMITS.LOJA_NOME} />
                <TextField
                    {...fieldProps}
                    name="slogan"
                    label="Frase de apresentação"
                    maxLength={LIMITS.LOJA_SLOGAN}
                    placeholder="Ex.: Doces artesanais feitos sob encomenda"
                    description="Aparece no topo da vitrine e na prévia do link."
                />

                <Controller
                    name="logo"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="loja-logo">Logo</FieldLabel>
                            <ImageUploadField
                                id="loja-logo"
                                value={field.value}
                                onChange={(value) => {
                                    field.onChange(value)
                                    if (value) form.setValue("removerLogo", false)
                                }}
                                currentUrl={removerLogo ? null : logoUrl}
                                onRemoveCurrent={() => form.setValue("removerLogo", true)}
                                maxSize={512}
                                quality={0.9}
                                disabled={isPending}
                                emptyLabel="Enviar logo (quadrado fica melhor)"
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />

                <Controller
                    name="cor"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="loja-cor">Cor da marca</FieldLabel>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    aria-label="Escolher a cor"
                                    value={/^#[0-9a-fA-F]{6}$/.test(field.value) ? field.value : "#000000"}
                                    onChange={(event) => field.onChange(event.target.value)}
                                    disabled={isPending}
                                    className="size-11 shrink-0 cursor-pointer rounded-lg border bg-background p-1"
                                />
                                <Input
                                    {...field}
                                    id="loja-cor"
                                    size="xl"
                                    maxLength={7}
                                    className="font-mono uppercase"
                                    disabled={isPending}
                                    aria-invalid={fieldState.invalid}
                                />
                            </div>
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>Botões, destaques e a tela de entrada. O texto se ajusta sozinho.</FieldDescription>
                            )}
                        </Field>
                    )}
                />
            </div>

            <div>
                <p className="text-sm font-semibold">Contato</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Os pedidos chegam neste WhatsApp.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                    name="whatsapp"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="loja-whatsapp">WhatsApp da loja</FieldLabel>
                            <Input
                                {...field}
                                id="loja-whatsapp"
                                type="tel"
                                size="xl"
                                inputMode="tel"
                                placeholder="(81) 99999-0000"
                                disabled={isPending}
                                onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>Sem ele, a loja não recebe pedidos.</FieldDescription>
                            )}
                        </Field>
                    )}
                />
                <TextField {...fieldProps} name="instagram" label="Instagram" maxLength={31} placeholder="@minhaloja" />
                <TextField
                    {...fieldProps}
                    name="endereco"
                    label="Endereço"
                    maxLength={LIMITS.LOJA_ENDERECO}
                    placeholder="Rua, número, bairro, cidade"
                    description="Para retirada e no rodapé do site."
                />
                <Controller
                    name="horario"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="loja-horario">Horário de atendimento</FieldLabel>
                            <Textarea
                                {...field}
                                id="loja-horario"
                                rows={2}
                                maxLength={LIMITS.LOJA_HORARIO}
                                placeholder="Seg a sex, 9h às 18h · Sáb, 9h às 13h"
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="aviso"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                            <FieldLabel htmlFor="loja-aviso">Aviso no topo do site</FieldLabel>
                            <Input
                                {...field}
                                id="loja-aviso"
                                size="xl"
                                maxLength={LIMITS.LOJA_AVISO}
                                placeholder="Ex.: Pedidos de Natal até dia 20/12"
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>Deixe vazio para não mostrar.</FieldDescription>
                            )}
                        </Field>
                    )}
                />
            </div>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Salvar loja
                </Button>
            </div>
        </form>
    )
}
