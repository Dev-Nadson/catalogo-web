import type { Metadata } from "next"

import { MeusPedidosList } from "./meus-pedidos-list"

export const metadata: Metadata = {
    title: "Meus pedidos",
}

export default function MeusPedidosPage() {
    return <MeusPedidosList />
}
