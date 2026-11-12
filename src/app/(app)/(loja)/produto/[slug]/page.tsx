import type { Metadata } from "next"

import { fotoUrl } from "~/lib/fotos"
import { getProdutoPublico } from "~/server/catalogo"
import { ProdutoView } from "./produto-view"

type ProdutoPageProps = {
    params: Promise<{ slug: string }>
}

/**
 * Lida no servidor para a prévia do link: quem cola /produto/<slug> no WhatsApp vê a foto,
 * o nome e a descrição. A página em si carrega do navegador, como o resto.
 */
export async function generateMetadata({ params }: ProdutoPageProps): Promise<Metadata> {
    const { slug } = await params
    const produto = await getProdutoPublico(slug)

    if (!produto) return { title: "Produto não encontrado" }

    const descricao = produto.descricao?.slice(0, 200) ?? undefined
    const foto = fotoUrl(produto.fotos[0])

    return {
        title: produto.nome,
        description: descricao,
        alternates: { canonical: `/produto/${slug}` },
        openGraph: {
            title: produto.nome,
            description: descricao,
            images: foto ? [{ url: foto, alt: produto.nome }] : undefined,
        },
    }
}

export default async function ProdutoPage({ params }: ProdutoPageProps) {
    const { slug } = await params

    return <ProdutoView slug={slug} />
}
