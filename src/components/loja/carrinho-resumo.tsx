"use client"

import type { LinhaCarrinho } from "~/hooks/use-carrinho"
import { resumoCarrinho } from "~/lib/carrinho"
import { TiposEntrega, type TipoEntrega } from "~/lib/constants"
import { formatCurrency } from "~/lib/utils"
import type { Configuracao } from "~/services/configuracoes"
import { ProdutoFoto } from "~/components/loja/produto-foto"

type CarrinhoResumoProps = {
    linhas: LinhaCarrinho[]
    subtotal: number
    tipoEntrega: TipoEntrega | undefined
    configuracao: Configuracao
}

/**
 * O resumo do checkout. É prévia: o valor que vale é o que o `pedidos_criar` grava, e é ele
 * que vai na mensagem do WhatsApp.
 */
export function CarrinhoResumo({ linhas, subtotal, tipoEntrega, configuracao }: CarrinhoResumoProps) {
    const resumo = resumoCarrinho(subtotal, tipoEntrega ?? null, configuracao)

    return (
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5" aria-label="Resumo do pedido">
            <h2 className="text-base font-semibold">Resumo</h2>

            <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto">
                {linhas.map(({ variacao, quantidade, subtotal: totalLinha }) => (
                    <li key={variacao.id} className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <ProdutoFoto path={variacao.produto.fotos[0]} alt="" className="size-12 rounded-lg" />
                            <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[11px] font-semibold text-background tabular-nums">
                                {quantidade}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{variacao.produto.nome}</p>
                            {variacao.rotulo && <p className="text-xs text-muted-foreground">{variacao.rotulo}</p>}
                        </div>
                        <span className="text-sm tabular-nums">{formatCurrency(totalLinha)}</span>
                    </li>
                ))}
            </ul>

            <dl className="flex flex-col gap-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatCurrency(resumo.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                        {tipoEntrega === TiposEntrega.RETIRADA ? "Retirada na loja" : "Entrega"}
                    </dt>
                    <dd className="tabular-nums">
                        {tipoEntrega === TiposEntrega.ENTREGA
                            ? resumo.taxa > 0
                                ? formatCurrency(resumo.taxa)
                                : "Grátis"
                            : tipoEntrega === TiposEntrega.RETIRADA
                              ? "Grátis"
                              : "—"}
                    </dd>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t pt-3">
                    <dt className="font-semibold">Total</dt>
                    <dd className="text-xl font-semibold tabular-nums">{formatCurrency(resumo.total)}</dd>
                </div>
            </dl>
        </section>
    )
}
