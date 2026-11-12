"use client"

import { useState } from "react"
import { Check, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { useCarrinho } from "~/hooks/use-carrinho"
import { isEstoqueBaixo, isVariacaoDisponivel, temEscolha } from "~/lib/carrinho"
import { cn, formatCurrency } from "~/lib/utils"
import type { ProdutoCatalogo } from "~/services/produtos"
import { Button } from "~/components/ui/button"
import { Preco } from "~/components/loja/preco"
import { QuantidadeInput } from "~/components/loja/quantidade-input"

type ProdutoCompraProps = {
    produto: ProdutoCatalogo
}

/** Escolha da variação, quantidade e o botão de adicionar (fixo no rodapé do celular). */
export function ProdutoCompra({ produto }: ProdutoCompraProps) {
    const adicionar = useCarrinho((state) => state.adicionar)
    const setAberto = useCarrinho((state) => state.setAberto)
    const itensNoCarrinho = useCarrinho((state) => state.itens)

    const escolha = temEscolha(produto.variacoes)
    const primeiraDisponivel = produto.variacoes.find(isVariacaoDisponivel)
    const [variacaoId, setVariacaoId] = useState<string | null>(
        escolha && produto.variacoes.length > 1 ? null : (primeiraDisponivel?.id ?? null)
    )
    const [quantidade, setQuantidade] = useState(1)

    const variacao = produto.variacoes.find((item) => item.id === variacaoId) ?? null
    const noCarrinho = itensNoCarrinho.find((item) => item.variacaoId === variacaoId)?.quantidade ?? 0
    const restante = variacao?.estoque === null || !variacao ? null : Math.max(0, variacao.estoque - noCarrinho)
    const esgotado = !primeiraDisponivel
    const precoMostrado = variacao ?? [...produto.variacoes].sort((a, b) => a.preco - b.preco)[0]

    function escolher(id: string) {
        setVariacaoId(id)
        setQuantidade(1)
    }

    function handleAdicionar() {
        if (!variacao) {
            toast.info(`Escolha ${produto.rotulo_variacao?.toLowerCase() ?? "uma opção"} antes de adicionar.`)
            return
        }

        adicionar(variacao.id, quantidade)
        setQuantidade(1)
        toast.success(`${produto.nome}${variacao.rotulo ? ` (${variacao.rotulo})` : ""} no carrinho.`, {
            action: { label: "Ver carrinho", onClick: () => setAberto(true) },
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <Preco
                preco={precoMostrado.preco}
                precoDe={precoMostrado.preco_de}
                aPartirDe={!variacao && produto.variacoes.some((item) => item.preco !== precoMostrado.preco)}
                size="lg"
            />

            {escolha && (
                <fieldset className="flex flex-col gap-3">
                    <legend className="mb-3 text-sm font-medium">
                        {produto.rotulo_variacao ?? "Opção"}
                        {variacao && <span className="font-normal text-muted-foreground">: {variacao.rotulo}</span>}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {produto.variacoes.map((item) => {
                            const disponivel = isVariacaoDisponivel(item)
                            const ativa = item.id === variacaoId

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={!disponivel}
                                    aria-pressed={ativa}
                                    onClick={() => escolher(item.id)}
                                    className={cn(
                                        "flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl border px-4 py-1.5 text-sm font-medium transition",
                                        ativa ? "border-primary bg-primary/10 text-primary ring-1 ring-primary" : "hover:border-foreground/30",
                                        !disponivel && "cursor-not-allowed text-muted-foreground line-through opacity-60"
                                    )}
                                >
                                    <span className="flex items-center gap-1">
                                        {ativa && <Check className="size-3.5" />}
                                        {item.rotulo}
                                    </span>
                                    {produto.variacoes.some((outra) => outra.preco !== item.preco) && (
                                        <span className="text-xs font-normal text-muted-foreground no-underline tabular-nums">
                                            {formatCurrency(item.preco)}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </fieldset>
            )}

            {variacao && isEstoqueBaixo(variacao.estoque) && (
                <p className="-mt-2 text-sm font-medium text-warning">
                    Corra: só restam {variacao.estoque} unidade{variacao.estoque === 1 ? "" : "s"}.
                </p>
            )}

            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0">
                {!esgotado && (
                    <QuantidadeInput
                        label="Quantidade"
                        size="lg"
                        value={quantidade}
                        max={restante}
                        onChange={setQuantidade}
                    />
                )}
                <Button
                    size="xl"
                    className="flex-1 rounded-full sm:max-w-xs"
                    disabled={esgotado || restante === 0}
                    onClick={handleAdicionar}
                >
                    <ShoppingBag />
                    {esgotado
                        ? "Esgotado"
                        : restante === 0
                          ? "Todo o estoque já está no carrinho"
                          : `Adicionar${variacao ? ` · ${formatCurrency(variacao.preco * quantidade)}` : ""}`}
                </Button>
            </div>
            {/* Espaço para a barra fixa do celular não cobrir a descrição. */}
            <div className="h-16 sm:hidden" aria-hidden="true" />
        </div>
    )
}
