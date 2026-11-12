"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import z from "zod"

import { describeAuthError, describeSigninError, toApiError } from "~/lib/errors"
import { QUERIES } from "~/lib/queries"
import { getHomePath } from "~/lib/sidebar"
import { cn, sanitizeRedirect } from "~/lib/utils"
import { createSession, getSessionMe, resendConfirmation } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { PasswordInput } from "~/components/ui/password-input"

const signinSchema = z.object({
    email: z.email("Informe um e-mail válido."),
    password: z.string().min(1, "Informe sua senha."),
})

type SigninValues = z.infer<typeof signinSchema>

/**
 * Volta para onde estava (`?redirect=`, posto pelo `proxy.ts` ou pelo carrinho) ou para a tela
 * inicial: a vitrine para o cliente, os pedidos para a equipe.
 */
export function SigninForm({ className, ...props }: React.ComponentProps<"form">) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [rootError, setRootError] = useState<string | null>(null)
    const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)

    const form = useForm<SigninValues>({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const { mutate: signin, isPending } = useMutation({
        mutationFn: createSession,
        onSuccess: async () => {
            const session = await queryClient.fetchQuery({
                queryKey: [QUERIES.GET_SESSION],
                queryFn: () => getSessionMe(),
            })

            const redirectTo = new URLSearchParams(window.location.search).get("redirect")

            router.replace(sanitizeRedirect(redirectTo, getHomePath(session?.role)))
        },
        onError: (error: unknown, values) => {
            setRootError(describeSigninError(error))
            setUnconfirmedEmail(toApiError(error).code === "email_not_confirmed" ? values.email : null)
        },
    })

    const { mutateAsync: resend, isPending: isResending } = useMutation({
        mutationFn: resendConfirmation,
    })

    function onSubmit(values: SigninValues) {
        setRootError(null)
        setUnconfirmedEmail(null)
        signin(values)
    }

    function handleResend() {
        if (!unconfirmedEmail || isResending) return

        toast.promise(resend({ email: unconfirmedEmail }), {
            loading: "Reenviando e-mail...",
            success: `Enviamos um novo link para ${unconfirmedEmail}.`,
            error: (error: unknown) => describeAuthError(error),
        })
    }

    return (
        <form
            {...props}
            id="signin-form"
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
                            <FieldLabel htmlFor="signin-email">E-mail</FieldLabel>
                            <Input
                                {...field}
                                id="signin-email"
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
                            <div className="flex items-center justify-between gap-3">
                                <FieldLabel htmlFor="signin-password">Senha</FieldLabel>
                                <Link
                                    href="/recuperar-senha"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Esqueci minha senha
                                </Link>
                            </div>
                            <PasswordInput
                                {...field}
                                id="signin-password"
                                size="xl"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />

                <Field>
                    {rootError && <FieldError>{rootError}</FieldError>}
                    {unconfirmedEmail && (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="w-full"
                            disabled={isResending}
                            onClick={handleResend}
                        >
                            {isResending && <LoaderCircle className="animate-spin" />}
                            Reenviar e-mail de confirmação
                        </Button>
                    )}
                    <Button type="submit" size="xl" className="w-full" disabled={isPending}>
                        {isPending && <LoaderCircle className="animate-spin" />}
                        Entrar
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
