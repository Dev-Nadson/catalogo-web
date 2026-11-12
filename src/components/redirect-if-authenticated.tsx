"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSession } from "~/hooks/use-session"
import { getHomePath } from "~/lib/sidebar"
import { sanitizeRedirect } from "~/lib/utils"
import { FullPageLoader } from "~/components/full-page-loader"

type RedirectIfAuthenticatedProps = {
    children: React.ReactNode
}

/**
 * Login e cadastro não fazem sentido para quem já está logado. É também por aqui que o link
 * de confirmação de e-mail (que aponta para /entrar?redirect=...) devolve o cliente ao
 * checkout, com o carrinho intacto.
 */
export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
    const router = useRouter()
    const { data: session, isPending } = useSession()

    useEffect(() => {
        if (!session) return

        const redirect = new URLSearchParams(window.location.search).get("redirect")

        router.replace(sanitizeRedirect(redirect, getHomePath(session.role)))
    }, [router, session])

    if (isPending || session) return <FullPageLoader />

    return children
}
