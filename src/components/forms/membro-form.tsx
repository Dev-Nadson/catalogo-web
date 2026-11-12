"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { Roles, STAFF_ROLE_OPTIONS } from "~/lib/constants"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

const membroSchema = z.object({
    email: z.email("Informe um e-mail válido."),
    role: z.enum([Roles.ATENDENTE, Roles.ADMIN]),
})

export type MembroFormValues = z.infer<typeof membroSchema>

const ROLE_DESCRIPTIONS = {
    [Roles.ATENDENTE]: "Vê os pedidos e muda o status. Não mexe em produtos nem em configurações.",
    [Roles.ADMIN]: "Acesso total: produtos, configurações, equipe e pedidos.",
}

type MembroFormProps = {
    isPending: boolean
    rootError: string | null
    onSubmit: (values: MembroFormValues) => void
    onCancel: () => void
}

export function MembroForm({ isPending, rootError, onSubmit, onCancel }: MembroFormProps) {
    const form = useForm<MembroFormValues>({
        resolver: zodResolver(membroSchema),
        defaultValues: { email: "", role: Roles.ATENDENTE },
    })

    const role = useWatch({ control: form.control, name: "role" })

    return (
        <form id="membro-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="membro-email">E-mail da conta</FieldLabel>
                        <Input
                            {...field}
                            id="membro-email"
                            type="email"
                            size="xl"
                            inputMode="email"
                            placeholder="pessoa@email.com"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <FieldDescription>A pessoa precisa ter criado uma conta na loja antes.</FieldDescription>
                        )}
                    </Field>
                )}
            />
            <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="membro-role">Papel</FieldLabel>
                        <Select
                            items={STAFF_ROLE_OPTIONS}
                            value={field.value}
                            onValueChange={(value) => value && field.onChange(value)}
                            disabled={isPending}
                        >
                            <SelectTrigger id="membro-role" size="xl" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STAFF_ROLE_OPTIONS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldDescription>{ROLE_DESCRIPTIONS[role]}</FieldDescription>
                    </Field>
                )}
            />

            {rootError && <FieldError>{rootError}</FieldError>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Adicionar
                </Button>
            </div>
        </form>
    )
}
