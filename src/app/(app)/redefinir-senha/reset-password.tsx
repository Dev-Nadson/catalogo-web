"use client"

import Link from "next/link"
import { LinkIcon, LoaderCircle } from "lucide-react"

import { useSession } from "~/hooks/use-session"
import { getHomePath } from "~/lib/sidebar"
import { Button } from "~/components/ui/button"
import { ResetPasswordForm } from "~/components/forms/reset-password-form"

/**
 * O supabase-js troca o código do link pela sessão antes do `getSession()` responder, então
 * aqui basta haver sessão para trocar a senha.
 */
export function ResetPassword() {
    const { data: session, isPending } = useSession()

    if (isPending) {
        return (
            <div className="grid place-items-center py-10">
                <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-label="Carregando" />
            </div>
        )
    }

    if (session) return <ResetPasswordForm homePath={getHomePath(session.role)} />

    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
            <LinkIcon className="size-8 text-warning" />
            <h3 className="text-lg font-semibold">Link inválido ou expirado</h3>
            <p className="text-sm text-muted-foreground">
                Os links de recuperação valem por pouco tempo e só podem ser usados uma vez. Peça um novo.
            </p>
            <Button size="lg" className="mt-2" render={<Link href="/recuperar-senha" />}>
                Pedir novo link
            </Button>
        </div>
    )
}
