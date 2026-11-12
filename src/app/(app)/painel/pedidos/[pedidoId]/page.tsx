import type { Metadata } from "next"

import { PedidoPainelView } from "./pedido-painel-view"

export const metadata: Metadata = {
    title: "Pedido",
}

type PedidoPainelPageProps = {
    params: Promise<{ pedidoId: string }>
}

export default async function PedidoPainelPage({ params }: PedidoPainelPageProps) {
    const { pedidoId } = await params

    return <PedidoPainelView pedidoId={pedidoId} />
}
