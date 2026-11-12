export type PaginatedResponse<T> = {
    data: T[]
    total: number
    page: number
    total_pages: number
}

/**
 * Um item do pedido (coluna `pedidos.itens`, jsonb), como o `pedidos_criar` grava: o retrato
 * do produto no momento da compra. O produto pode mudar ou sumir depois; o pedido não.
 */
export type PedidoItem = {
    variacao_id: string
    produto_id: string
    produto_nome: string
    /** Vazio quando o produto não tem variação. */
    variacao_rotulo: string
    preco: number
    quantidade: number
    subtotal: number
    /** Saiu do estoque (e volta se o pedido for cancelado). */
    reservado: boolean
}

/** O que o navegador manda em `pedidos.itens`. Preço nenhum: quem calcula é o banco. */
export type PedidoItemInput = {
    variacao_id: string
    quantidade: number
}

/** Endereço de entrega (coluna `pedidos.endereco`, jsonb). Sem as chaves vazias. */
export type Endereco = {
    cep?: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf?: string
}

/** O que o navegador manda em `pedidos.endereco`: vazio vai como null e o banco limpa. */
export type EnderecoInput = { [Campo in keyof Endereco]?: string | null }
