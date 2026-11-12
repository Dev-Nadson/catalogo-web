/** Nome usado enquanto a loja não tem nome configurado (e nas telas sem a configuração). */
export const APP_NAME = "Catálogo"

export type SelectOption<TValue> = {
    value: TValue
    label: string
}

export const Roles = {
    CLIENTE: "cliente",
    ATENDENTE: "atendente",
    ADMIN: "admin",
} as const

export type Role = (typeof Roles)[keyof typeof Roles]

export const RoleLabels: Record<Role, string> = {
    [Roles.CLIENTE]: "Cliente",
    [Roles.ATENDENTE]: "Atendente",
    [Roles.ADMIN]: "Admin",
}

/** Quem entra no painel: vê e atende os pedidos. */
export const STAFF_ROLES: readonly Role[] = [Roles.ATENDENTE, Roles.ADMIN]

/** Quem mexe no catálogo, nas configurações e na equipe. */
export const ADMIN_ROLES: readonly Role[] = [Roles.ADMIN]

export const STAFF_ROLE_OPTIONS: SelectOption<Role>[] = STAFF_ROLES.map((role) => ({
    value: role,
    label: RoleLabels[role],
}))

export function isStaff(role: Role | undefined) {
    return role !== undefined && STAFF_ROLES.includes(role)
}

export function isAdmin(role: Role | undefined) {
    return role === Roles.ADMIN
}

export const PedidoStatuses = {
    NOVO: "novo",
    EM_ATENDIMENTO: "em_atendimento",
    CONCLUIDO: "concluido",
    CANCELADO: "cancelado",
} as const

export type PedidoStatus = (typeof PedidoStatuses)[keyof typeof PedidoStatuses]

export const PedidoStatusLabels: Record<PedidoStatus, string> = {
    [PedidoStatuses.NOVO]: "Novo",
    [PedidoStatuses.EM_ATENDIMENTO]: "Em atendimento",
    [PedidoStatuses.CONCLUIDO]: "Concluído",
    [PedidoStatuses.CANCELADO]: "Cancelado",
}

export const PEDIDO_STATUS_OPTIONS: SelectOption<PedidoStatus>[] = Object.values(PedidoStatuses).map(
    (status) => ({ value: status, label: PedidoStatusLabels[status] })
)

/** "Em aberto" junta novo e em atendimento: é o que a equipe precisa resolver. */
export const FILTRO_EM_ABERTO = "em-aberto"

export type PedidoFiltroStatus = PedidoStatus | typeof FILTRO_EM_ABERTO | null

export const PeriodosPedido = {
    HOJE: "hoje",
    SETE_DIAS: "7-dias",
    TRINTA_DIAS: "30-dias",
    TODOS: "todos",
} as const

export type PeriodoPedido = (typeof PeriodosPedido)[keyof typeof PeriodosPedido]

export const PeriodoPedidoLabels: Record<PeriodoPedido, string> = {
    [PeriodosPedido.HOJE]: "Hoje",
    [PeriodosPedido.SETE_DIAS]: "Últimos 7 dias",
    [PeriodosPedido.TRINTA_DIAS]: "Últimos 30 dias",
    [PeriodosPedido.TODOS]: "Todos",
}

/** Filtro da lista de produtos do painel. */
export const ProdutoFiltroStatuses = {
    TODOS: "todos",
    ATIVOS: "ativos",
    INATIVOS: "inativos",
} as const

export type ProdutoFiltroStatus = (typeof ProdutoFiltroStatuses)[keyof typeof ProdutoFiltroStatuses]

export const ProdutoFiltroStatusLabels: Record<ProdutoFiltroStatus, string> = {
    [ProdutoFiltroStatuses.TODOS]: "Todos",
    [ProdutoFiltroStatuses.ATIVOS]: "À venda",
    [ProdutoFiltroStatuses.INATIVOS]: "Fora da vitrine",
}

export const TiposEntrega = {
    ENTREGA: "entrega",
    RETIRADA: "retirada",
} as const

export type TipoEntrega = (typeof TiposEntrega)[keyof typeof TiposEntrega]

export const TipoEntregaLabels: Record<TipoEntrega, string> = {
    [TiposEntrega.ENTREGA]: "Entrega",
    [TiposEntrega.RETIRADA]: "Retirada na loja",
}

export const FormasPagamento = {
    PIX: "pix",
    CREDITO: "credito",
    DEBITO: "debito",
    DINHEIRO: "dinheiro",
} as const

export type FormaPagamento = (typeof FormasPagamento)[keyof typeof FormasPagamento]

export const FormaPagamentoLabels: Record<FormaPagamento, string> = {
    [FormasPagamento.PIX]: "Pix",
    [FormasPagamento.CREDITO]: "Cartão de crédito",
    [FormasPagamento.DEBITO]: "Cartão de débito",
    [FormasPagamento.DINHEIRO]: "Dinheiro",
}

export const FORMA_PAGAMENTO_OPTIONS: SelectOption<FormaPagamento>[] = Object.values(FormasPagamento).map(
    (forma) => ({ value: forma, label: FormaPagamentoLabels[forma] })
)

/** Limites de texto e quantidade, iguais aos `check` do `schema.sql`: mudou aqui, muda lá. */
export const LIMITS = {
    NOME_PESSOA: 80,
    LOJA_NOME: 60,
    LOJA_SLOGAN: 120,
    LOJA_ENDERECO: 160,
    LOJA_HORARIO: 160,
    LOJA_AVISO: 200,
    CHAVE_PIX: 100,
    CATEGORIA_NOME: 40,
    PRODUTO_NOME: 80,
    PRODUTO_DESCRICAO: 1000,
    PRODUTO_FOTOS: 6,
    ROTULO_VARIACAO: 30,
    VARIACAO_ROTULO: 40,
    VARIACOES: 20,
    LOGRADOURO: 120,
    NUMERO: 20,
    COMPLEMENTO: 80,
    BAIRRO: 80,
    CIDADE: 80,
    OBSERVACOES: 500,
    QUANTIDADE: 99,
    ITENS_PEDIDO: 50,
} as const

/** Igual a `max_pedidos_abertos()` no `schema.sql`. */
export const MAX_PEDIDOS_ABERTOS = 3

/** A partir de quantas unidades a tela avisa "Restam N". */
export const ESTOQUE_BAIXO = 5

export const PAGE_SIZE = 10

export const MIN_PASSWORD_LENGTH = 8

/** Cor da marca enquanto a loja não configura a dela. Igual ao default de `configuracoes.cor`. */
export const COR_PADRAO = "#0f766e"

/** Cor escura padrão (textos e rodapé). Igual ao default de `configuracoes.cor_escura`. */
export const COR_ESCURA_PADRAO = "#18181b"
