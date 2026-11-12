"use client"

import { ShoppingBag } from "lucide-react"

import { useCarrinho, useCarrinhoDetalhado } from "~/hooks/use-carrinho"
import { formatCurrency, pluralize } from "~/lib/utils"

/**
 * Barra fixa no rodapé do celular com a quantidade e o subtotal: o carrinho fica à mão sem
 * subir a página. No desktop, o botão do cabeçalho basta.
 */
export function CarrinhoBar() {
    const setAberto = useCarrinho((state) => state.setAberto)
    const { quantidadeTotal, subtotal, linhas } = useCarrinhoDetalhado()

    if (!quantidadeTotal) return null

    return (
        <>
            {/* Espaço para a barra não cobrir o fim da página. */}
            <div className="h-20 sm:hidden" aria-hidden="true" />
            <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
                <button
                    type="button"
                    onClick={() => setAberto(true)}
                    className="flex h-14 w-full animate-fade-up items-center gap-3 rounded-2xl bg-primary px-4 text-primary-foreground shadow-lg shadow-black/15 active:scale-[0.99]"
                >
                    <ShoppingBag className="size-5" />
                    <span className="font-semibold">Ver carrinho</span>
                    <span className="text-sm opacity-80">{pluralize(quantidadeTotal, "item", "itens")}</span>
                    <span className="ml-auto font-semibold tabular-nums">
                        {linhas.length ? formatCurrency(subtotal) : "…"}
                    </span>
                </button>
            </div>
        </>
    )
}
