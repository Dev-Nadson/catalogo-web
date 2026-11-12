"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useSession } from "~/hooks/use-session"
import { FullPageLoader } from "~/components/full-page-loader"

type RequireSessionProps = {
    children: React.ReactNode
}

/**
 * O `proxy.ts` já barra quem chega sem login; aqui fica o caso da sessão que expira (ou do
 * logout em outra aba) com a tela aberta.
 */
export function RequireSession({ children }: RequireSessionProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, isPending } = useSession()

    const target = !isPending && !session ? `/entrar?redirect=${encodeURIComponent(pathname)}` : null

    useEffect(() => {
        if (target) router.replace(target)
    }, [router, target])

    if (isPending || target) return <FullPageLoader />

    return children
}
