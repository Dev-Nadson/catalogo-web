import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { ProdutosActions } from "./produtos-actions"
import { ProdutosList } from "./produtos-list"

export const metadata: Metadata = {
    title: "Produtos",
}

export default function ProdutosPage() {
    return (
        <>
            <PageHeader
                title="Produtos"
                description="O que aparece na vitrine. Desligue “À venda” para esconder sem apagar."
            />

            <ProdutosActions />
            <ProdutosList />
        </>
    )
}
