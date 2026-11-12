"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"

type AuthLinkProps = {
    href: string
    children: React.ReactNode
}

function subscribe() {
    return () => {}
}

/**
 * Link entre entrar e cadastrar que leva junto o `?redirect=`: quem veio do carrinho volta
 * para o checkout, qualquer que seja a tela de acesso que usar.
 */
export function AuthLink({ href, children }: AuthLinkProps) {
    const search = useSyncExternalStore(
        subscribe,
        () => window.location.search,
        () => ""
    )
    const redirect = new URLSearchParams(search).get("redirect")

    return (
        <Link
            href={redirect ? `${href}?redirect=${encodeURIComponent(redirect)}` : href}
            className="font-medium text-primary hover:underline"
        >
            {children}
        </Link>
    )
}
