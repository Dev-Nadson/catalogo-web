import {
    FILTRO_EM_ABERTO,
    PAGE_SIZE,
    PedidoStatuses,
    PeriodosPedido,
    type FormaPagamento,
    type PedidoFiltroStatus,
    type PedidoStatus,
    type PeriodoPedido,
    type TipoEntrega,
} from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import { onlyDigits, sanitizeSearch } from "~/lib/utils"
import type { EnderecoInput, PaginatedResponse, PedidoItemInput } from "~/typings"
import type { Database } from "~/typings/database"

export type Pedido = Database["public"]["Tables"]["pedidos"]["Row"]

const PEDIDO_SELECT =
    "id, numero, cliente_id, status, tipo_entrega, cliente_nome, cliente_telefone, endereco, forma_pagamento, troco_para, observacoes, itens, subtotal, taxa_entrega, total, criado_em, atualizado_em"

type CreatePedidoInput = {
    tipoEntrega: TipoEntrega
    clienteNome: string
    clienteTelefone: string
    endereco: EnderecoInput | null
    formaPagamento: FormaPagamento
    trocoPara: number | null
    observacoes: string | null
    itens: PedidoItemInput[]
}

export type CreatePedidoOutput = Pedido

/**
 * O navegador manda só variação e quantidade. Preço, taxa, total, estoque e as regras da loja
 * (aberta, mínimo, formas de pagamento) são do `pedidos_criar`; os erros dele chegam com a
 * mensagem pronta. O pedido volta inteiro porque a mensagem do WhatsApp sai dele.
 */
export async function createPedido(input: CreatePedidoInput): Promise<CreatePedidoOutput> {
    const { data, error } = await supabase
        .from("pedidos")
        .insert({
            tipo_entrega: input.tipoEntrega,
            cliente_nome: input.clienteNome,
            cliente_telefone: input.clienteTelefone,
            endereco: input.endereco,
            forma_pagamento: input.formaPagamento,
            troco_para: input.trocoPara,
            observacoes: input.observacoes,
            itens: input.itens,
        })
        .select(PEDIDO_SELECT)
        .single()

    throwIfError(error)

    return data!
}

type ListMeusPedidosInput = {
    page: number
}

export type ListMeusPedidosOutput = PaginatedResponse<Pedido>

/** Filtra pelo próprio id mesmo com o RLS: para a equipe, o RLS libera os pedidos de todos. */
export async function listMeusPedidos({ page }: ListMeusPedidosInput): Promise<ListMeusPedidosOutput> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) throw new ApiError("Entre na sua conta.", { status: 401 })

    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await supabase
        .from("pedidos")
        .select(PEDIDO_SELECT, { count: "exact" })
        .eq("cliente_id", session.user.id)
        .order("criado_em", { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

    throwIfError(error)

    const total = count ?? 0

    return { data: data ?? [], total, page, total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

type GetPedidoInput = {
    pedidoId: string
}

export type GetPedidoOutput = Pedido

export async function getPedido({ pedidoId }: GetPedidoInput): Promise<GetPedidoOutput> {
    const { data, error } = await supabase.from("pedidos").select(PEDIDO_SELECT).eq("id", pedidoId).maybeSingle()

    throwIfError(error)

    if (!data) throw new ApiError("Pedido não encontrado.", { status: 404 })

    return data
}

/** Meia-noite local do primeiro dia do período, em ISO. */
function inicioDoPeriodo(periodo: PeriodoPedido) {
    const dias = { [PeriodosPedido.HOJE]: 0, [PeriodosPedido.SETE_DIAS]: 6, [PeriodosPedido.TRINTA_DIAS]: 29 }

    if (periodo === PeriodosPedido.TODOS) return null

    const inicio = new Date()

    inicio.setHours(0, 0, 0, 0)
    inicio.setDate(inicio.getDate() - dias[periodo])

    return inicio.toISOString()
}

type ListPedidosInput = {
    page: number
    search: string
    status: PedidoFiltroStatus
    periodo: PeriodoPedido
}

export type ListPedidosOutput = PaginatedResponse<Pedido>

/** Busca pelo número (#123), pelo nome ou pelo telefone do cliente. */
export async function listPedidos({ page, search, status, periodo }: ListPedidosInput): Promise<ListPedidosOutput> {
    const from = (page - 1) * PAGE_SIZE
    const term = sanitizeSearch(search.replace(/^#/, ""))
    const digits = onlyDigits(term)
    const inicio = inicioDoPeriodo(periodo)

    let query = supabase
        .from("pedidos")
        .select(PEDIDO_SELECT, { count: "exact" })
        .order("criado_em", { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

    if (term) {
        const filtros = [`cliente_nome.ilike.%${term}%`]

        if (digits && digits === term.replace(/\s/g, "")) {
            if (digits.length <= 9) filtros.push(`numero.eq.${digits}`)
            filtros.push(`cliente_telefone.ilike.%${digits}%`)
        }

        query = query.or(filtros.join(","))
    }

    if (status === FILTRO_EM_ABERTO) query = query.in("status", [PedidoStatuses.NOVO, PedidoStatuses.EM_ATENDIMENTO])
    else if (status) query = query.eq("status", status)

    if (inicio) query = query.gte("criado_em", inicio)

    const { data, count, error } = await query

    throwIfError(error)

    const total = count ?? 0

    return { data: data ?? [], total, page, total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/** O número do menu do painel: pedidos que ninguém pegou ainda. */
export async function countPedidosNovos(): Promise<number> {
    const { count, error } = await supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .eq("status", PedidoStatuses.NOVO)

    throwIfError(error)

    return count ?? 0
}

type UpdatePedidoStatusInput = {
    pedidoId: string
    status: PedidoStatus
}

/**
 * Equipe muda entre os status em aberto e encerra; o cliente só cancela o próprio pedido
 * novo. Quem garante é o `pedidos_protect`, que também devolve o estoque no cancelamento.
 */
export async function updatePedidoStatus({ pedidoId, status }: UpdatePedidoStatusInput): Promise<void> {
    const { data, error } = await supabase.from("pedidos").update({ status }).eq("id", pedidoId).select("id")

    throwIfError(error)
    assertAffected(data)
}
