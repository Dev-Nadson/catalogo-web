import type { QueryClient } from "@tanstack/react-query"

export const QUERIES = {
    GET_SESSION: "get-session",
    GET_MEU_PERFIL: "get-meu-perfil",
    GET_CONFIGURACAO: "get-configuracao",
    LIST_CATEGORIAS: "list-categorias",
    LIST_CATALOGO: "list-catalogo",
    GET_PRODUTO_SLUG: "get-produto-slug",
    LIST_VARIACOES_CARRINHO: "list-variacoes-carrinho",
    LIST_PRODUTOS: "list-produtos",
    GET_PRODUTO: "get-produto",
    LIST_MEUS_PEDIDOS: "list-meus-pedidos",
    LIST_PEDIDOS: "list-pedidos",
    GET_PEDIDO: "get-pedido",
    COUNT_PEDIDOS_NOVOS: "count-pedidos-novos",
    LIST_EQUIPE: "list-equipe",
    GET_CEP: "get-cep",
} as const

/**
 * O produto aparece na vitrine, na página dele, no carrinho (preço e estoque) e na lista do
 * painel. Um pedido feito ou cancelado também mexe no estoque de tudo isso.
 */
export function invalidateProdutos(queryClient: QueryClient) {
    return Promise.all(
        [
            QUERIES.LIST_CATALOGO,
            QUERIES.GET_PRODUTO_SLUG,
            QUERIES.LIST_VARIACOES_CARRINHO,
            QUERIES.LIST_PRODUTOS,
            QUERIES.GET_PRODUTO,
        ].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    )
}

/** O pedido aparece no histórico do cliente, no painel, no detalhe e no contador do menu. */
export function invalidatePedidos(queryClient: QueryClient) {
    return Promise.all(
        [
            QUERIES.LIST_MEUS_PEDIDOS,
            QUERIES.LIST_PEDIDOS,
            QUERIES.GET_PEDIDO,
            QUERIES.COUNT_PEDIDOS_NOVOS,
        ].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    )
}

/** A configuração aparece no site inteiro (cabeçalho, rodapé, checkout) e no painel. */
export function invalidateConfiguracao(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: [QUERIES.GET_CONFIGURACAO] })
}

/** O nome da categoria vem embutido nos produtos da vitrine e do painel. */
export function invalidateCategorias(queryClient: QueryClient) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERIES.LIST_CATEGORIAS] }),
        invalidateProdutos(queryClient),
    ])
}

/** Nome e telefone da conta preenchem o checkout; o nome aparece também no menu. */
export function invalidatePerfil(queryClient: QueryClient) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERIES.GET_MEU_PERFIL] }),
        queryClient.invalidateQueries({ queryKey: [QUERIES.GET_SESSION] }),
        queryClient.invalidateQueries({ queryKey: [QUERIES.LIST_EQUIPE] }),
    ])
}
