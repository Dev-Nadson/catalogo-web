"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import z from "zod"

import { MIN_PASSWORD_LENGTH } from "~/lib/constants"
import { describeAuthError } from "~/lib/errors"
import { cn } from "~/lib/utils"
import { updatePassword } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field"
import { PasswordInput } from "~/components/ui/password-input"

const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(MIN_PASSWORD_LENGTH, `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`),
        confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
    })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

type ResetPasswordFormProps = React.ComponentProps<"form"> & {
    /** Para onde ir depois de salvar: a tela inicial de quem está logado. */
    homePath: string
}

export function ResetPasswordForm({ className, homePath, ...props }: ResetPasswordFormProps) {
    const router = useRouter()
    const [rootError, setRootError] = useState<string | null>(null)

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    })

    const { mutate: save, isPending } = useMutation({
        mutationFn: updatePassword,
        onSuccess: () => {
            toast.success("Senha alterada.")
            router.replace(homePath)
        },
        onError: (error: unknown) => setRootError(describeAuthError(error)),
    })

    function onSubmit({ password }: ResetPasswordValues) {
        setRootError(null)
        save({ password })
    }

    return (
        <form
            {...props}
            id="reset-password-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(className)}
        >
            <FieldGroup>
                <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="reset-password-password">Nova senha</FieldLabel>
                            <PasswordInput
                                {...field}
                                id="reset-password-password"
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
                            <FieldLabel htmlFor="reset-password-confirm">Confirmar nova senha</FieldLabel>
                            <PasswordInput
                                {...field}
                                id="reset-password-confirm"
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
                        Salvar nova senha
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
