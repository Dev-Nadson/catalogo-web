import { Check, CircleX } from "lucide-react"

import {
    FormaPagamentoLabels,
    FormasPagamento,
    PedidoStatusLabels,
    PedidoStatuses,
    TipoEntregaLabels,
    TiposEntrega,
    type PedidoStatus,
} from "~/lib/constants"
import { formatEndereco, nomeItem } from "~/lib/pedido"
import { cn, formatCurrency, formatPhone } from "~/lib/utils"
import type { Pedido } from "~/services/pedidos"
import { DataField, Section } from "~/components/detail-section"

type PedidoProps = {
    pedido: Pedido
}

/** Itens e totais do pedido, como o banco gravou. */
export function PedidoItens({ pedido }: PedidoProps) {
    return (
        <Section title="Itens">
            <ul className="-my-2 flex flex-col divide-y">
                {pedido.itens.map((item) => (
                    <li key={item.variacao_id} className="flex items-baseline gap-3 py-2.5 text-sm">
                        <span className="w-8 shrink-0 font-semibold tabular-nums">{item.quantidade}×</span>
                        <span className="min-w-0 flex-1">
                            {nomeItem(item)}
                            <span className="block text-xs text-muted-foreground tabular-nums">
                                {formatCurrency(item.preco)} cada
                            </span>
                        </span>
                        <span className="tabular-nums">{formatCurrency(item.subtotal)}</span>
                    </li>
                ))}
            </ul>
            <dl className="flex flex-col gap-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatCurrency(pedido.subtotal)}</dd>
                </div>
                {pedido.tipo_entrega === TiposEntrega.ENTREGA && (
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">Entrega</dt>
                        <dd className="tabular-nums">
                            {pedido.taxa_entrega > 0 ? formatCurrency(pedido.taxa_entrega) : "Grátis"}
                        </dd>
                    </div>
                )}
                <div className="mt-1 flex items-baseline justify-between border-t pt-3">
                    <dt className="font-semibold">Total</dt>
                    <dd className="text-xl font-semibold tabular-nums">{formatCurrency(pedido.total)}</dd>
                </div>
            </dl>
        </Section>
    )
}

type PedidoInfoProps = PedidoProps & {
    /** O painel mostra também o contato do cliente. */
    mostrarCliente?: boolean
}

export function PedidoInfo({ pedido, mostrarCliente = false }: PedidoInfoProps) {
    return (
        <Section title="Entrega e pagamento">
            <div className="grid gap-4 sm:grid-cols-2">
                {mostrarCliente && (
                    <>
                        <DataField label="Cliente">{pedido.cliente_nome}</DataField>
                        <DataField label="WhatsApp">{formatPhone(pedido.cliente_telefone)}</DataField>
                    </>
                )}
                <DataField label={TipoEntregaLabels[pedido.tipo_entrega]}>
                    {pedido.tipo_entrega === TiposEntrega.ENTREGA ? formatEndereco(pedido.endereco) : "O cliente busca na loja"}
                </DataField>
                <DataField label="Pagamento">
                    {FormaPagamentoLabels[pedido.forma_pagamento]}
                    {pedido.forma_pagamento === FormasPagamento.DINHEIRO && (
                        <span className="text-muted-foreground">
                            {pedido.troco_para ? ` · troco para ${formatCurrency(pedido.troco_para)}` : " · sem troco"}
                        </span>
                    )}
                </DataField>
                {pedido.observacoes && (
                    <div className="sm:col-span-2">
                        <DataField label="Observações">
                            <span className="whitespace-pre-line">{pedido.observacoes}</span>
                        </DataField>
                    </div>
                )}
            </div>
        </Section>
    )
}

const ETAPAS: PedidoStatus[] = [PedidoStatuses.NOVO, PedidoStatuses.EM_ATENDIMENTO, PedidoStatuses.CONCLUIDO]

const ETAPA_TEXTOS: Record<PedidoStatus, string> = {
    [PedidoStatuses.NOVO]: "Enviado",
    [PedidoStatuses.EM_ATENDIMENTO]: "Em atendimento",
    [PedidoStatuses.CONCLUIDO]: "Concluído",
    [PedidoStatuses.CANCELADO]: "Cancelado",
}

/** A linha do tempo que o cliente acompanha. Cancelado substitui as etapas. */
export function PedidoEtapas({ status }: { status: PedidoStatus }) {
    if (status === PedidoStatuses.CANCELADO) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                <CircleX className="size-4" />
                Pedido {PedidoStatusLabels[status].toLowerCase()}
            </div>
        )
    }

    const atual = ETAPAS.indexOf(status)

    return (
        <ol className="grid grid-cols-3 gap-2" aria-label="Andamento do pedido">
            {ETAPAS.map((etapa, index) => {
                const feita = index <= atual

                return (
                    <li key={etapa} className="flex flex-col gap-2" aria-current={index === atual ? "step" : undefined}>
                        <span className={cn("h-1.5 rounded-full", feita ? "bg-primary" : "bg-muted")} />
                        <span
                            className={cn(
                                "flex items-start gap-1 text-xs font-medium sm:text-sm",
                                feita ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {feita && <Check className="mt-px size-3.5 shrink-0 text-primary" />}
                            {ETAPA_TEXTOS[etapa]}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}
