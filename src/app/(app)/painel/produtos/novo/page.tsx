import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { PageHeader } from "~/components/page-header"
import { NovoProduto } from "./novo-produto"

export const metadata: Metadata = {
    title: "Novo produto",
}

export default function NovoProdutoPage() {
    return (
        <>
            <BackLink href="/painel/produtos">Produtos</BackLink>
            <PageHeader title="Novo produto" />
            <NovoProduto />
        </>
    )
}
