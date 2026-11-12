"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS } from "~/lib/constants"
import { maskPhoneInput, onlyDigits } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Field, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { EnderecoFields, enderecoSchema } from "~/components/forms/endereco-fields"

/** Espelha os `check` de `profiles`. O endereço é opcional: o checkout pede quando precisar. */
const meusDadosSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe seu nome.")
        .max(LIMITS.NOME_PESSOA, `No máximo ${LIMITS.NOME_PESSOA} caracteres.`),
    telefone: z.string().refine((value) => /^\d{10,11}$/.test(onlyDigits(value)), "Informe o WhatsApp com DDD."),
    endereco: enderecoSchema,
})

export type MeusDadosFormValues = z.infer<typeof meusDadosSchema>

type MeusDadosFormProps = {
    defaultValues: MeusDadosFormValues
    email: string
    isPending: boolean
    onSubmit: (values: MeusDadosFormValues) => void
}

export function MeusDadosForm({ defaultValues, email, isPending, onSubmit }: MeusDadosFormProps) {
    const form = useForm<MeusDadosFormValues>({
        resolver: zodResolver(meusDadosSchema),
        defaultValues,
    })

    return (
        <form id="meus-dados-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                    name="nome"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="meus-dados-nome">Nome</FieldLabel>
                            <Input
                                {...field}
                                id="meus-dados-nome"
                                size="xl"
                                autoComplete="name"
                                maxLength={LIMITS.NOME_PESSOA}
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="telefone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="meus-dados-telefone">WhatsApp</FieldLabel>
                            <Input
                                {...field}
                                id="meus-dados-telefone"
                                type="tel"
                                size="xl"
                                inputMode="tel"
                                autoComplete="tel-national"
                                disabled={isPending}
                                onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="meus-dados-email">E-mail</FieldLabel>
                    <Input id="meus-dados-email" size="xl" value={email} disabled readOnly />
                </Field>
            </div>

            <div>
                <p className="text-sm font-semibold">Endereço de entrega</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Já vem preenchido no checkout.</p>
            </div>
            <EnderecoFields
                control={form.control}
                setValue={form.setValue}
                name="endereco"
                idPrefix="meus-dados-endereco"
                disabled={isPending}
            />

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Salvar dados
                </Button>
            </div>
        </form>
    )
}
