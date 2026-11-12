"use client"

import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Bike, Store } from "lucide-react"

import { PedidoStatuses, TipoEntregaLabels, TiposEntrega } from "~/lib/constants"
import { buildWhatsAppUrl, whatsAppDoCliente } from "~/lib/mensagem"
import { contarItens } from "~/lib/pedido"
import { QUERIES } from "~/lib/queries"
import { cn, formatCurrency, formatPhone, formatSince, pluralize } from "~/lib/utils"
import { listPedidos } from "~/services/pedidos"
import { Button } from "~/components/ui/button"
import {
    ListBody,
    ListCell,
    ListEmpty,
    ListFooter,
    ListHead,
    ListHeader,
    ListRoot,
    ListRow,
    ListSkeletonRows,
    ListTable,
} from "~/components/ui/list"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { PedidoStatusBadge } from "~/components/badges"
import { WhatsAppIcon } from "~/components/whatsapp-icon"
import { usePedidos } from "./pedidos-store"

const COLUMNS = 7

export function PedidosList() {
    const { page, search, status, periodo, setPage } = usePedidos()

    const { data: pedidos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_PEDIDOS, { page, search, status, periodo }],
        queryFn: () => listPedidos({ page, search, status, periodo }),
        // Sem isto a tabela pisca o skeleton a cada troca de página ou filtro.
        placeholderData: keepPreviousData,
    })

    const hasResults = Boolean(pedidos?.data.length)
    const filtrando = Boolean(search || status)

    return (
        <ListRoot>
            <ListTable>
                <ListHeader>
                    <ListRow className="hover:bg-transparent">
                        <ListHead>Pedido</ListHead>
                        <ListHead>Cliente</ListHead>
                        <ListHead className="hidden md:table-cell">Itens</ListHead>
                        <ListHead className="hidden sm:table-cell">Recebe</ListHead>
                        <ListHead className="text-right">Total</ListHead>
                        <ListHead>Status</ListHead>
                        <ListHead className="text-right">Ações</ListHead>
                    </ListRow>
                </ListHeader>

                <ListBody>
                    {isPending && <ListSkeletonRows cols={COLUMNS} />}

                    {!isPending && !hasResults && (
                        <ListEmpty cols={COLUMNS}>
                            {filtrando ? "Nenhum pedido com esses filtros." : "Nenhum pedido ainda. Eles aparecem aqui na hora."}
                        </ListEmpty>
                    )}

                    {!isPending &&
                        pedidos?.data.map((pedido) => (
                            <ListRow
                                key={pedido.id}
                                className={cn(pedido.status === PedidoStatuses.NOVO && "bg-warning-soft/40")}
                            >
                                <ListCell>
                                    <Link href={`/painel/pedidos/${pedido.id}`} className="font-semibold tabular-nums hover:underline">
                                        #{pedido.numero}
                                    </Link>
                                    <span className="block text-xs text-muted-foreground tabular-nums">
                                        {formatSince(pedido.criado_em)}
                                    </span>
                                </ListCell>
                                <ListCell>
                                    <span className="block max-w-48 truncate font-medium">{pedido.cliente_nome}</span>
                                    <span className="block text-xs text-muted-foreground tabular-nums">
                                        {formatPhone(pedido.cliente_telefone)}
                                    </span>
                                </ListCell>
                                <ListCell className="hidden text-muted-foreground md:table-cell">
                                    {pluralize(contarItens(pedido.itens), "item", "itens")}
                                </ListCell>
                                <ListCell className="hidden sm:table-cell">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        {pedido.tipo_entrega === TiposEntrega.ENTREGA ? (
                                            <Bike className="size-4" />
                                        ) : (
                                            <Store className="size-4" />
                                        )}
                                        {TipoEntregaLabels[pedido.tipo_entrega]}
                                    </span>
                                </ListCell>
                                <ListCell className="text-right font-medium tabular-nums">
                                    {formatCurrency(pedido.total)}
                                </ListCell>
                                <ListCell>
                                    <PedidoStatusBadge status={pedido.status} />
                                </ListCell>
                                <ListCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label={`Conversar com ${pedido.cliente_nome} no WhatsApp`}
                                                        render={
                                                            <a
                                                                href={buildWhatsAppUrl(whatsAppDoCliente(pedido.cliente_telefone))}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            />
                                                        }
                                                    >
                                                        <WhatsAppIcon className="size-4" />
                                                    </Button>
                                                }
                                            />
                                            <TooltipContent>Conversar no WhatsApp</TooltipContent>
                                        </Tooltip>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            render={<Link href={`/painel/pedidos/${pedido.id}`} />}
                                        >
                                            Abrir
                                        </Button>
                                    </div>
                                </ListCell>
                            </ListRow>
                        ))}
                </ListBody>
            </ListTable>

            <ListFooter
                total={pedidos?.total}
                page={pedidos?.page}
                pages={pedidos?.total_pages}
                onPageChange={setPage}
            />
        </ListRoot>
    )
}
