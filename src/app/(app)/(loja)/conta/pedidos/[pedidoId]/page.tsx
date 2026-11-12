import type { Metadata } from "next"

import { PedidoClienteView } from "./pedido-cliente-view"

export const metadata: Metadata = {
    title: "Pedido",
}

type PedidoPageProps = {
    params: Promise<{ pedidoId: string }>
    searchParams: Promise<{ novo?: string }>
}

/** `?novo=1` é a chegada do checkout: mostra o "pedido enviado" e o botão do WhatsApp. */
export default async function PedidoPage({ params, searchParams }: PedidoPageProps) {
    const { pedidoId } = await params
    const { novo } = await searchParams

    return <PedidoClienteView pedidoId={pedidoId} novo={novo === "1"} />
}
