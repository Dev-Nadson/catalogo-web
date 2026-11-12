"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSession } from "~/hooks/use-session"
import type { Role } from "~/lib/constants"
import { getHomePath } from "~/lib/sidebar"
import { FullPageLoader } from "~/components/full-page-loader"

type RequireRoleProps = {
    roles: readonly Role[]
    children: React.ReactNode
}

/**
 * Esconder a rota é conveniência; quem garante a permissão é o RLS do Supabase. Sempre
 * dentro de um `RequireSession`, então a sessão já está carregada. Cliente no painel volta
 * para a vitrine; atendente nas telas do admin volta para os pedidos.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
    const router = useRouter()
    const { data: session } = useSession()
    const allowed = Boolean(session && roles.includes(session.role))

    useEffect(() => {
        if (!allowed) router.replace(getHomePath(session?.role))
    }, [allowed, router, session?.role])

    if (!allowed) return <FullPageLoader />

    return children
}
