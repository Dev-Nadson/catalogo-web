"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, PackageX, Share2 } from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "~/lib/errors"
import { QUERIES } from "~/lib/queries"
import { listCategorias } from "~/services/categorias"
import { getProdutoBySlug } from "~/services/produtos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { ProdutoCompra } from "./produto-compra"
import { ProdutoGaleria } from "./produto-galeria"

type ProdutoViewProps = {
    slug: string
}

/** Compartilhar nativo no celular (abre o WhatsApp direto); no desktop, copia o link. */
async function compartilhar(nome: string) {
    const url = window.location.href

    if (navigator.share) {
        try {
            await navigator.share({ title: nome, url })
        } catch {
            // O cliente fechou a janela de compartilhar.
        }
        return
    }

    await navigator.clipboard.writeText(url)
    toast.success("Link do produto copiado.")
}

export function ProdutoView({ slug }: ProdutoViewProps) {
    const { data: produto, isPending, error } = useQuery({
        queryKey: [QUERIES.GET_PRODUTO_SLUG, { slug }],
        queryFn: () => getProdutoBySlug({ slug }),
    })

    const { data: categorias } = useQuery({
        queryKey: [QUERIES.LIST_CATEGORIAS],
        queryFn: () => listCategorias(),
    })

    if (error instanceof ApiError && error.status === 404) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
                <PackageX className="size-10 text-muted-foreground" strokeWidth={1.5} />
                <h1 className="text-xl font-semibold">Produto não encontrado</h1>
                <p className="text-sm text-muted-foreground">Ele pode ter saído do catálogo.</p>
                <Button size="lg" render={<Link href="/" />}>
                    Ver outros produtos
                </Button>
            </div>
        )
    }

    if (isPending || !produto) {
        return (
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 md:grid-cols-2 md:py-10">
                <Skeleton className="aspect-square w-full rounded-3xl" />
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    const categoria = categorias?.find((item) => item.id === produto.categoria_id)

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
            <Button variant="ghost" size="sm" className="-ml-2 mb-3" render={<Link href="/" />}>
                <ChevronLeft />
                Catálogo
            </Button>

            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                <ProdutoGaleria fotos={produto.fotos} nome={produto.nome} />

                <div className="flex flex-col gap-6 md:py-2">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            {categoria && (
                                <p className="mb-1 text-xs font-medium tracking-wider text-primary uppercase">
                                    {categoria.nome}
                                </p>
                            )}
                            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                                {produto.nome}
                            </h1>
                        </div>
                        <Button
                            variant="outline"
                            size="icon-lg"
                            className="shrink-0 rounded-full"
                            aria-label="Compartilhar produto"
                            onClick={() => compartilhar(produto.nome)}
                        >
                            <Share2 />
                        </Button>
                    </div>

                    <ProdutoCompra key={produto.id} produto={produto} />

                    {produto.descricao && (
                        <div className="border-t pt-6">
                            <h2 className="mb-2 text-sm font-semibold">Descrição</h2>
                            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                {produto.descricao}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
