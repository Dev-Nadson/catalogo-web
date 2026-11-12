"use client"

import { useEffect } from "react"
import { toast } from "sonner"

import { useCarrinho, useCarrinhoDetalhado } from "~/hooks/use-carrinho"
import { pluralize } from "~/lib/utils"

/**
 * Montado uma vez no layout da loja. Quando o banco responde, tira do carrinho o que saiu do
 * catálogo e baixa a quantidade que passou do estoque, avisando o cliente. Assim o checkout
 * só esbarra no estoque se alguém comprar no meio do caminho.
 */
export function CarrinhoSync() {
    const substituir = useCarrinho((state) => state.substituir)
    const { itens, variacoes, isSincronizado } = useCarrinhoDetalhado()

    useEffect(() => {
        if (!isSincronizado || !itens.length) return

        let removidos = 0
        let ajustados = 0

        const novos = itens.flatMap((item) => {
            const variacao = variacoes.get(item.variacaoId)

            if (!variacao || variacao.estoque === 0) {
                removidos += 1
                return []
            }

            if (variacao.estoque !== null && item.quantidade > variacao.estoque) {
                ajustados += 1
                return [{ ...item, quantidade: variacao.estoque }]
            }

            return [item]
        })

        if (!removidos && !ajustados) return

        substituir(novos)

        if (removidos) {
            toast.warning(
                `${pluralize(removidos, "item saiu", "itens saíram")} do carrinho por não estar mais disponível.`
            )
        }
        if (ajustados) {
            toast.warning(
                `Ajustamos a quantidade de ${pluralize(ajustados, "item", "itens")} ao estoque disponível.`
            )
        }
    }, [isSincronizado, itens, variacoes, substituir])

    return null
}
