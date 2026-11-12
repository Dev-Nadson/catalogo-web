"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS } from "~/lib/constants"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"

/** Espelha os `check` de `categorias`. O slug sai do nome, no `onSubmit`. */
const categoriaSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe o nome.")
        .max(LIMITS.CATEGORIA_NOME, `No máximo ${LIMITS.CATEGORIA_NOME} caracteres.`),
    ordem: z.string().refine((value) => /^\d{1,4}$/.test(value.trim()), "Use um número de 0 a 9999."),
})

export type CategoriaFormValues = z.infer<typeof categoriaSchema>

type CategoriaFormProps = {
    defaultValues?: CategoriaFormValues
    isPending: boolean
    onSubmit: (values: CategoriaFormValues) => void
    onCancel: () => void
}

export function CategoriaForm({ defaultValues, isPending, onSubmit, onCancel }: CategoriaFormProps) {
    const form = useForm<CategoriaFormValues>({
        resolver: zodResolver(categoriaSchema),
        defaultValues: defaultValues ?? { nome: "", ordem: "0" },
    })

    return (
        <form id="categoria-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="nome"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="categoria-nome">Nome</FieldLabel>
                        <Input
                            {...field}
                            id="categoria-nome"
                            size="xl"
                            maxLength={LIMITS.CATEGORIA_NOME}
                            placeholder="Ex.: Camisetas"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
            <Controller
                name="ordem"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="categoria-ordem">Ordem</FieldLabel>
                        <Input
                            {...field}
                            id="categoria-ordem"
                            size="xl"
                            inputMode="numeric"
                            className="w-32"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <FieldDescription>Menor aparece primeiro na vitrine.</FieldDescription>
                        )}
                    </Field>
                )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    )
}
