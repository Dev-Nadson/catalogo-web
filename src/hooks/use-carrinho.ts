import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { useHydrated } from "~/hooks/use-hydrated"
import { LIMITS } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { listVariacoesCarrinho, type VariacaoCarrinho } from "~/services/produtos"

export type ItemCarrinho = {
    variacaoId: string
    quantidade: number
}

type CarrinhoStore = {
    itens: ItemCarrinho[]
    /** A gaveta do carrinho. Não vai para o localStorage. */
    aberto: boolean
    adicionar: (variacaoId: string, quantidade: number) => void
    alterar: (variacaoId: string, quantidade: number) => void
    remover: (variacaoId: string) => void
    substituir: (itens: ItemCarrinho[]) => void
    limpar: () => void
    setAberto: (aberto: boolean) => void
}

function limitar(quantidade: number) {
    return Math.min(LIMITS.QUANTIDADE, Math.max(1, Math.floor(quantidade)))
}

/**
 * O carrinho guarda só `variacaoId` e quantidade, no localStorage: sobrevive a recarregar a
 * página e à ida até o e-mail de confirmação. Preço, nome e estoque vêm sempre do banco
 * (`useCarrinhoDetalhado`), então o cliente nunca vê preço velho.
 */
export const useCarrinho = create<CarrinhoStore>()(
    persist(
        (set) => ({
            itens: [],
            aberto: false,

            adicionar: (variacaoId, quantidade) =>
                set((state) => {
                    const existente = state.itens.find((item) => item.variacaoId === variacaoId)

                    if (existente) {
                        return {
                            itens: state.itens.map((item) =>
                                item.variacaoId === variacaoId
                                    ? { ...item, quantidade: limitar(item.quantidade + quantidade) }
                                    : item
                            ),
                        }
                    }

                    if (state.itens.length >= LIMITS.ITENS_PEDIDO) return state

                    return { itens: [...state.itens, { variacaoId, quantidade: limitar(quantidade) }] }
                }),
            alterar: (variacaoId, quantidade) =>
                set((state) => ({
                    itens: state.itens.map((item) =>
                        item.variacaoId === variacaoId ? { ...item, quantidade: limitar(quantidade) } : item
                    ),
                })),
            remover: (variacaoId) =>
                set((state) => ({ itens: state.itens.filter((item) => item.variacaoId !== variacaoId) })),
            substituir: (itens) => set({ itens }),
            limpar: () => set({ itens: [] }),
            setAberto: (aberto) => set({ aberto }),
        }),
        {
            name: "catalogo-carrinho",
            version: 1,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ itens: state.itens }),
        }
    )
)

export type LinhaCarrinho = {
    variacao: VariacaoCarrinho
    quantidade: number
    subtotal: number
}

/**
 * O carrinho com os dados do banco. Todos os componentes que usam este hook dividem a mesma
 * query (chave pelos ids), então a busca acontece uma vez só.
 */
export function useCarrinhoDetalhado() {
    const hydrated = useHydrated()
    const itens = useCarrinho((state) => state.itens)
    const ids = itens.map((item) => item.variacaoId).sort()

    const query = useQuery({
        queryKey: [QUERIES.LIST_VARIACOES_CARRINHO, { ids }],
        queryFn: () => listVariacoesCarrinho({ ids }),
        enabled: hydrated && ids.length > 0,
        placeholderData: keepPreviousData,
    })

    const variacoes = new Map((query.data ?? []).map((variacao) => [variacao.id, variacao]))
    const visiveis = hydrated ? itens : []
    const linhas: LinhaCarrinho[] = []

    for (const item of visiveis) {
        const variacao = variacoes.get(item.variacaoId)

        if (variacao) linhas.push({ variacao, quantidade: item.quantidade, subtotal: variacao.preco * item.quantidade })
    }

    return {
        itens: visiveis,
        linhas,
        quantidadeTotal: visiveis.reduce((total, item) => total + item.quantidade, 0),
        subtotal: linhas.reduce((total, linha) => total + linha.subtotal, 0),
        isPending: visiveis.length > 0 && (query.isPending || query.isPlaceholderData),
        /** Resposta já é das variações atuais do carrinho (e não a anterior, de placeholder). */
        isSincronizado: query.isSuccess && !query.isPlaceholderData,
        variacoes,
    }
}
