"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { useCarrinho } from "~/hooks/use-carrinho"
import { isEsgotado, isVariacaoDisponivel, precoVitrine, temEscolha } from "~/lib/carrinho"
import type { ProdutoCatalogo } from "~/services/produtos"
import { Button } from "~/components/ui/button"
import { DescontoBadge, Preco } from "~/components/loja/preco"
import { ProdutoFoto } from "~/components/loja/produto-foto"

type ProdutoCardProps = {
    produto: ProdutoCatalogo
    priority?: boolean
}

/**
 * Card da vitrine. Produto de variação única ganha o "+" que põe direto no carrinho; com
 * escolha (tamanho, cor), o "+" leva para a página do produto.
 */
export function ProdutoCard({ produto, priority }: ProdutoCardProps) {
    const adicionar = useCarrinho((state) => state.adicionar)
    const setAberto = useCarrinho((state) => state.setAberto)

    const preco = precoVitrine(produto.variacoes)
    const esgotado = isEsgotado(produto.variacoes)
    const escolha = temEscolha(produto.variacoes)
    const href = `/produto/${produto.slug}`

    function handleAdicionar() {
        const variacao = produto.variacoes.find(isVariacaoDisponivel)

        if (!variacao) return

        adicionar(variacao.id, 1)
        toast.success(`${produto.nome} no carrinho.`, {
            action: { label: "Ver carrinho", onClick: () => setAberto(true) },
        })
    }

    return (
        <article className="group relative flex flex-col gap-3">
            <Link href={href} className="relative block overflow-hidden rounded-2xl" aria-label={produto.nome}>
                <ProdutoFoto
                    path={produto.fotos[0]}
                    alt=""
                    priority={priority}
                    className="aspect-square w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    {esgotado ? (
                        <span className="rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-semibold text-background">
                            Esgotado
                        </span>
                    ) : (
                        preco && <DescontoBadge preco={preco.preco} precoDe={preco.precoDe} />
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-1.5 px-0.5">
                <Link href={href} className="line-clamp-2 text-sm leading-snug font-medium hover:underline sm:text-base">
                    {produto.nome}
                </Link>

                <div className="mt-auto flex items-end justify-between gap-2">
                    {preco && <Preco preco={preco.preco} precoDe={preco.precoDe} aPartirDe={preco.aPartirDe} />}

                    {!esgotado &&
                        (escolha ? (
                            <Button
                                size="icon-lg"
                                variant="secondary"
                                className="shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                                aria-label={`Escolher opção de ${produto.nome}`}
                                render={<Link href={href} />}
                            >
                                <Plus />
                            </Button>
                        ) : (
                            <Button
                                size="icon-lg"
                                className="shrink-0 rounded-full"
                                aria-label={`Adicionar ${produto.nome} ao carrinho`}
                                onClick={handleAdicionar}
                            >
                                <Plus />
                            </Button>
                        ))}
                </div>
            </div>
        </article>
    )
}
