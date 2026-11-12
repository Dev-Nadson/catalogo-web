import {
    FormaPagamentoLabels,
    FormasPagamento,
    TiposEntrega,
    type FormaPagamento,
    type TipoEntrega,
} from "~/lib/constants"
import { formatEndereco, nomeItem } from "~/lib/pedido"
import { formatCurrency, formatPhone } from "~/lib/utils"
import type { Endereco, PedidoItem } from "~/typings"

export type PedidoMensagem = {
    id: string
    numero: number
    tipo_entrega: TipoEntrega
    cliente_nome: string
    cliente_telefone: string
    endereco: Partial<Endereco> | null
    forma_pagamento: FormaPagamento
    troco_para: number | null
    observacoes: string | null
    itens: PedidoItem[]
    subtotal: number
    taxa_entrega: number
    total: number
}

type BuildPedidoMensagemInput = {
    pedido: PedidoMensagem
    lojaNome: string
    /** Origem do site (`window.location.origin`), para o link do pedido no painel. */
    origin: string
}

/**
 * A mensagem que chega no WhatsApp da loja. Sai sempre do pedido gravado (preços e total do
 * `pedidos_criar`), nunca do carrinho: o que a loja lê é o que está no banco.
 */
export function buildPedidoMensagem({ pedido, lojaNome, origin }: BuildPedidoMensagemInput) {
    const linhas = [`*Pedido #${pedido.numero} · ${lojaNome}*`, ""]

    for (const item of pedido.itens) {
        linhas.push(`${item.quantidade}x ${nomeItem(item)} — ${formatCurrency(item.subtotal)}`)
    }

    linhas.push("")

    if (pedido.tipo_entrega === TiposEntrega.ENTREGA) {
        linhas.push(`Subtotal: ${formatCurrency(pedido.subtotal)}`)
        linhas.push(`Entrega: ${pedido.taxa_entrega > 0 ? formatCurrency(pedido.taxa_entrega) : "grátis"}`)
    }

    linhas.push(`*Total: ${formatCurrency(pedido.total)}*`, "")

    linhas.push(
        pedido.tipo_entrega === TiposEntrega.ENTREGA
            ? `*Entrega:* ${formatEndereco(pedido.endereco)}`
            : "*Retirada na loja*"
    )

    const troco =
        pedido.forma_pagamento === FormasPagamento.DINHEIRO && pedido.troco_para
            ? ` (troco para ${formatCurrency(pedido.troco_para)})`
            : ""

    linhas.push(`*Pagamento:* ${FormaPagamentoLabels[pedido.forma_pagamento]}${troco}`)

    if (pedido.observacoes) linhas.push(`*Observações:* ${pedido.observacoes}`)

    linhas.push(`*Cliente:* ${pedido.cliente_nome} — ${formatPhone(pedido.cliente_telefone)}`)
    linhas.push("", `Ver no painel: ${origin}/painel/pedidos/${pedido.id}`)

    return linhas.join("\n")
}

/** Link `wa.me`. O número vai só com dígitos e o 55 do Brasil (`configuracoes.whatsapp`). */
export function buildWhatsAppUrl(numero: string, texto?: string) {
    const base = `https://wa.me/${numero.replace(/\D/g, "")}`

    return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}

/** O telefone do cliente é gravado sem o 55 (DDD + número). */
export function whatsAppDoCliente(telefone: string) {
    return `55${telefone.replace(/\D/g, "")}`
}

/**
 * No celular, o WhatsApp abre na própria aba, a partir da tela do pedido: assim o "voltar"
 * do navegador cai no pedido, e não no checkout vazio. O checkout deixa aqui (sessionStorage)
 * o id do pedido a abrir uma vez só; recarregar a tela do pedido não reabre.
 */
export const ABRIR_WHATSAPP_KEY = "catalogo:abrir-whatsapp"
