import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { EditarProduto } from "./editar-produto"

export const metadata: Metadata = {
    title: "Editar produto",
}

type EditarProdutoPageProps = {
    params: Promise<{ produtoId: string }>
}

export default async function EditarProdutoPage({ params }: EditarProdutoPageProps) {
    const { produtoId } = await params

    return (
        <>
            <BackLink href="/painel/produtos">Produtos</BackLink>
            <EditarProduto produtoId={produtoId} />
        </>
    )
}
