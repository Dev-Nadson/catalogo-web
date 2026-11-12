"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingBag } from "lucide-react"

import { useCarrinho, useCarrinhoDetalhado } from "~/hooks/use-carrinho"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { isEstoqueBaixo } from "~/lib/carrinho"
import { formatCurrency, pluralize } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet"
import { Skeleton } from "~/components/ui/skeleton"
import { CarrinhoAvisos } from "~/components/loja/carrinho-avisos"
import { ProdutoFoto } from "~/components/loja/produto-foto"
import { QuantidadeInput } from "~/components/loja/quantidade-input"

/** A gaveta do carrinho, aberta pelo ícone do cabeçalho, pela barra do celular ou pelo toast. */
export function CarrinhoSheet() {
    const router = useRouter()
    const aberto = useCarrinho((state) => state.aberto)
    const setAberto = useCarrinho((state) => state.setAberto)
    const alterar = useCarrinho((state) => state.alterar)
    const remover = useCarrinho((state) => state.remover)
    const { data: configuracao } = useConfiguracao()
    const { itens, linhas, quantidadeTotal, subtotal, isPending } = useCarrinhoDetalhado()

    const vazio = itens.length === 0
    const abaixoDoMinimo = Boolean(configuracao && subtotal < configuracao.pedido_minimo)
    const fechada = configuracao?.aberta === false

    function handleFinalizar() {
        setAberto(false)
        router.push("/finalizar")
    }

    return (
        <Sheet open={aberto} onOpenChange={setAberto}>
            <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
                <SheetHeader className="border-b">
                    <SheetTitle className="text-lg font-semibold">Seu carrinho</SheetTitle>
                    <SheetDescription>
                        {vazio ? "Nenhum item ainda." : pluralize(quantidadeTotal, "item", "itens")}
                    </SheetDescription>
                </SheetHeader>

                {vazio ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                        <div className="grid size-16 place-items-center rounded-full bg-muted">
                            <ShoppingBag className="size-7 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Seu carrinho está vazio.</p>
                        <Button size="lg" onClick={() => setAberto(false)} render={<Link href="/" />}>
                            Ver produtos
                        </Button>
                    </div>
                ) : (
                    <ul className="flex flex-1 flex-col divide-y overflow-y-auto px-4">
                        {isPending && !linhas.length
                            ? itens.map((item) => (
                                  <li key={item.variacaoId} className="flex gap-3 py-4">
                                      <Skeleton className="size-18 rounded-xl" />
                                      <div className="flex flex-1 flex-col gap-2">
                                          <Skeleton className="h-4 w-3/4" />
                                          <Skeleton className="h-4 w-1/3" />
                                      </div>
                                  </li>
                              ))
                            : linhas.map(({ variacao, quantidade, subtotal: totalLinha }) => (
                                  <li key={variacao.id} className="flex gap-3 py-4">
                                      <Link
                                          href={`/produto/${variacao.produto.slug}`}
                                          onClick={() => setAberto(false)}
                                          className="shrink-0"
                                      >
                                          <ProdutoFoto
                                              path={variacao.produto.fotos[0]}
                                              alt={variacao.produto.nome}
                                              className="size-18 rounded-xl"
                                          />
                                      </Link>
                                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                                          <div className="min-w-0">
                                              <p className="line-clamp-2 text-sm leading-snug font-medium">
                                                  {variacao.produto.nome}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                  {variacao.rotulo && `${variacao.rotulo} · `}
                                                  <span className="tabular-nums">{formatCurrency(variacao.preco)}</span>
                                                  {isEstoqueBaixo(variacao.estoque) && (
                                                      <span className="text-warning"> · restam {variacao.estoque}</span>
                                                  )}
                                              </p>
                                          </div>
                                          <div className="flex items-center justify-between gap-2">
                                              <QuantidadeInput
                                                  label={`Quantidade de ${variacao.produto.nome}`}
                                                  value={quantidade}
                                                  max={variacao.estoque}
                                                  onChange={(value) => alterar(variacao.id, value)}
                                                  onRemove={() => remover(variacao.id)}
                                              />
                                              <span className="text-sm font-semibold tabular-nums">
                                                  {formatCurrency(totalLinha)}
                                              </span>
                                          </div>
                                      </div>
                                  </li>
                              ))}
                    </ul>
                )}

                {!vazio && configuracao && (
                    <SheetFooter className="gap-3 border-t bg-background-muted">
                        <CarrinhoAvisos subtotal={subtotal} configuracao={configuracao} />

                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Subtotal</span>
                            <span className="text-xl font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
                        </div>
                        {configuracao.aceita_entrega &&
                            configuracao.taxa_entrega > 0 &&
                            subtotal < (configuracao.frete_gratis_acima ?? Number.POSITIVE_INFINITY) && (
                            <p className="-mt-2 text-xs text-muted-foreground">A taxa de entrega entra no próximo passo.</p>
                        )}

                        {fechada && (
                            <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
                                A loja está fechada agora. Você pode montar o carrinho e finalizar quando ela abrir.
                            </p>
                        )}

                        <Button
                            size="xl"
                            className="w-full"
                            disabled={isPending || abaixoDoMinimo || fechada}
                            onClick={handleFinalizar}
                        >
                            Finalizar pedido
                        </Button>
                        <Button variant="ghost" size="lg" className="w-full" onClick={() => setAberto(false)}>
                            Continuar comprando
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    )
}
