"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LoaderCircle, MailCheck } from "lucide-react"
import z from "zod"

import { LIMITS, MIN_PASSWORD_LENGTH } from "~/lib/constants"
import { describeSignupError } from "~/lib/errors"
import { QUERIES } from "~/lib/queries"
import { cn, maskPhoneInput, onlyDigits, sanitizeRedirect } from "~/lib/utils"
import { createAccount } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { PasswordInput } from "~/components/ui/password-input"

const signupSchema = z
    .object({
        nome: z
            .string()
            .trim()
            .min(2, "Informe seu nome.")
            .max(LIMITS.NOME_PESSOA, `O nome deve ter no máximo ${LIMITS.NOME_PESSOA} caracteres.`),
        telefone: z
            .string()
            .refine((value) => /^\d{10,11}$/.test(onlyDigits(value)), "Informe o WhatsApp com DDD."),
        email: z.email("Informe um e-mail válido."),
        password: z
            .string()
            .min(MIN_PASSWORD_LENGTH, `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`),
        confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
    })

type SignupValues = z.infer<typeof signupSchema>

/**
 * Cadastro do cliente (toda conta nova é cliente). Nome e WhatsApp já preenchem o checkout.
 * O `?redirect=` segue até o link de confirmação, para voltar ao carrinho.
 */
export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [rootError, setRootError] = useState<string | null>(null)
    const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

    const form = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            nome: "",
            telefone: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const { mutate: signup, isPending } = useMutation({
        mutationFn: createAccount,
        onSuccess: async ({ needsConfirmation }, values) => {
            if (needsConfirmation) {
                setConfirmationEmail(values.email)
                return
            }

            await queryClient.invalidateQueries({ queryKey: [QUERIES.GET_SESSION] })
            router.replace(sanitizeRedirect(values.redirect, "/"))
        },
        onError: (error: unknown) => setRootError(describeSignupError(error)),
    })

    function onSubmit({ nome, telefone, email, password }: SignupValues) {
        setRootError(null)

        const redirect = new URLSearchParams(window.location.search).get("redirect")

        signup({ nome, telefone: onlyDigits(telefone), email, password, redirect: sanitizeRedirect(redirect, "") || null })
    }

    if (confirmationEmail) {
        return (
            <div className={cn("flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center", className)}>
                <MailCheck className="size-8 text-primary" />
                <h3 className="text-lg font-bold">Confirme seu e-mail</h3>
                <p className="text-sm text-muted-foreground">
                    Enviamos um link para <b className="text-foreground">{confirmationEmail}</b>. Abra o link
                    neste mesmo aparelho: seu carrinho continua guardado e você volta direto para finalizar.
                </p>
            </div>
        )
    }

    return (
        <form
            {...props}
            id="signup-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(className)}
        >
            <FieldGroup>
                <Controller
                    name="nome"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="signup-nome">Nome</FieldLabel>
                            <Input
                                {...field}
                                id="signup-nome"
                                size="xl"
                                autoComplete="name"
                                placeholder="Seu nome"
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
                            <FieldLabel htmlFor="signup-telefone">WhatsApp</FieldLabel>
                            <Input
                                {...field}
                                id="signup-telefone"
                                type="tel"
                                size="xl"
                                inputMode="tel"
                                autoComplete="tel-national"
                                placeholder="(81) 99999-0000"
                                onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>A loja fala com você por este número.</FieldDescription>
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="signup-email">E-mail</FieldLabel>
                            <Input
                                {...field}
                                id="signup-email"
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

                <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="signup-password">Senha</FieldLabel>
                            <PasswordInput
                                {...field}
                                id="signup-password"
                                size="xl"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</FieldDescription>
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="signup-confirm-password">Confirmar senha</FieldLabel>
                            <PasswordInput
                                {...field}
                                id="signup-confirm-password"
                                size="xl"
                                autoComplete="new-password"
                                placeholder="••••••••"
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
                        Criar conta
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
