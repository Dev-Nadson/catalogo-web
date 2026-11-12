"use client"

import { useState } from "react"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { LoaderCircle, MailCheck } from "lucide-react"
import z from "zod"

import { describeAuthError } from "~/lib/errors"
import { cn } from "~/lib/utils"
import { sendPasswordReset } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"

const forgotPasswordSchema = z.object({
    email: z.email("Informe um e-mail válido."),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
    const [rootError, setRootError] = useState<string | null>(null)
    const [sentTo, setSentTo] = useState<string | null>(null)

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    })

    const { mutate: send, isPending } = useMutation({
        mutationFn: sendPasswordReset,
        onSuccess: (_, values) => setSentTo(values.email),
        onError: (error: unknown) => setRootError(describeAuthError(error)),
    })

    function onSubmit(values: ForgotPasswordValues) {
        setRootError(null)
        send(values)
    }

    // Mesma resposta exista ou não a conta: o Supabase não revela quais e-mails estão cadastrados.
    if (sentTo) {
        return (
            <div className={cn("flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center", className)}>
                <MailCheck className="size-8 text-primary" />
                <h3 className="font-heading text-lg font-bold">Confira seu e-mail</h3>
                <p className="text-sm text-muted-foreground">
                    Se existir uma conta com <b className="text-foreground">{sentTo}</b>, você vai receber um
                    link para criar uma nova senha.
                </p>
                <Button variant="outline" size="lg" className="mt-2" render={<Link href="/entrar" />}>
                    Voltar para o login
                </Button>
            </div>
        )
    }

    return (
        <form
            {...props}
            id="forgot-password-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(className)}
        >
            <FieldGroup>
                <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="forgot-password-email">E-mail</FieldLabel>
                            <Input
                                {...field}
                                id="forgot-password-email"
                                type="email"
                                size="xl"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="seu@email.com"
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />

                <Field>
                    {rootError && <FieldError>{rootError}</FieldError>}
                    <Button type="submit" size="xl" className="w-full" disabled={isPending}>
                        {isPending && <LoaderCircle className="animate-spin" />}
                        Enviar link
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
