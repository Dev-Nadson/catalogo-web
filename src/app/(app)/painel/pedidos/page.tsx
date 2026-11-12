import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { LojaStatus } from "./loja-status"
import { PedidosActions } from "./pedidos-actions"
import { PedidosList } from "./pedidos-list"

export const metadata: Metadata = {
    title: "Pedidos",
}

export default function PedidosPage() {
    return (
        <>
            <PageHeader
                title="Pedidos"
                description="Os pedidos chegam aqui na hora, junto com a mensagem no WhatsApp da loja."
                action={<LojaStatus />}
            />

            <PedidosActions />
            <PedidosList />
        </>
    )
}
