import type { Metadata } from "next"

import { RequireSession } from "~/components/require-session"
import { FinalizarView } from "./finalizar-view"

export const metadata: Metadata = {
    title: "Finalizar pedido",
    robots: { index: false, follow: false },
}

/** O `proxy.ts` manda quem não tem conta para /entrar?redirect=/finalizar. */
export default function FinalizarPage() {
    return (
        <RequireSession>
            <FinalizarView />
        </RequireSession>
    )
}
