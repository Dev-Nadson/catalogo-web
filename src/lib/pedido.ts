import { PedidoStatuses, type PedidoStatus } from "~/lib/constants"
import { formatCep } from "~/lib/utils"
import type { Endereco, PedidoItem } from "~/typings"

/**
 * Para onde a equipe pode mover o pedido. Igual ao `pedidos_protect`: concluído e cancelado
 * são finais.
 */
export const PROXIMOS_STATUS: Record<PedidoStatus, PedidoStatus[]> = {
    [PedidoStatuses.NOVO]: [PedidoStatuses.EM_ATENDIMENTO, PedidoStatuses.CONCLUIDO, PedidoStatuses.CANCELADO],
    [PedidoStatuses.EM_ATENDIMENTO]: [PedidoStatuses.NOVO, PedidoStatuses.CONCLUIDO, PedidoStatuses.CANCELADO],
    [PedidoStatuses.CONCLUIDO]: [],
    [PedidoStatuses.CANCELADO]: [],
}

export function isPedidoAberto(status: PedidoStatus) {
    return PROXIMOS_STATUS[status].length > 0
}

/** O cliente só cancela enquanto a loja não começou a atender (`pedidos_protect`). */
export function canClienteCancelar(status: PedidoStatus) {
    return status === PedidoStatuses.NOVO
}

/** "Camiseta Básica (P)"; sem parênteses quando o produto não tem variação. */
export function nomeItem(item: Pick<PedidoItem, "produto_nome" | "variacao_rotulo">) {
    return item.variacao_rotulo ? `${item.produto_nome} (${item.variacao_rotulo})` : item.produto_nome
}

export function contarItens(itens: Pick<PedidoItem, "quantidade">[]) {
    return itens.reduce((total, item) => total + item.quantidade, 0)
}

/** "Rua A, 10 — Apto 2, Centro, Recife/PE — CEP 50000-000". */
export function formatEndereco(endereco: Partial<Endereco> | null | undefined) {
    if (!endereco) return ""

    const rua = [endereco.logradouro, endereco.numero].filter(Boolean).join(", ")
    const cidade = [endereco.cidade, endereco.uf].filter(Boolean).join("/")
    const partes = [
        [rua, endereco.complemento].filter(Boolean).join(" — "),
        endereco.bairro,
        cidade,
    ].filter(Boolean)

    return `${partes.join(", ")}${endereco.cep ? ` — CEP ${formatCep(endereco.cep)}` : ""}`
}
