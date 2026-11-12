"use client"

import { useState } from "react"
import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ChevronRight, Receipt } from "lucide-react"

import { useRealtimePedidos } from "~/hooks/use-realtime-pedidos"
import { contarItens } from "~/lib/pedido"
import { QUERIES } from "~/lib/queries"
import { formatCurrency, formatTimestamp, pluralize } from "~/lib/utils"
import { listMeusPedidos } from "~/services/pedidos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { PedidoStatusBadge } from "~/components/badges"

export function MeusPedidosList() {
    const [page, setPage] = useState(1)

    // Status muda na hora quando a loja atende.
    useRealtimePedidos()

    const { data: pedidos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_MEUS_PEDIDOS, { page }],
        queryFn: () => listMeusPedidos({ page }),
        placeholderData: keepPreviousData,
    })

    if (isPending) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                ))}
            </div>
        )
    }

    if (!pedidos?.data.length) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-16 text-center">
                <Receipt className="size-10 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
                <Button size="lg" render={<Link href="/" />}>
                    Ver produtos
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
                {pedidos.data.map((pedido) => (
                    <li key={pedido.id}>
                        <Link
                            href={`/conta/pedidos/${pedido.id}`}
                            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-foreground/20 hover:shadow-sm"
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold tabular-nums">Pedido #{pedido.numero}</span>
                                    <PedidoStatusBadge status={pedido.status} />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {formatTimestamp(pedido.criado_em)} ·{" "}
                                    {pluralize(contarItens(pedido.itens), "item", "itens")}
                                </span>
                            </div>
                            <span className="font-semibold tabular-nums">{formatCurrency(pedido.total)}</span>
                            <ChevronRight className="size-4 text-muted-foreground" />
                        </Link>
                    </li>
                ))}
            </ul>

            {pedidos.total_pages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground tabular-nums">
                        {page} de {pedidos.total_pages}
                    </span>
                    <Button variant="outline" disabled={page >= pedidos.total_pages} onClick={() => setPage(page + 1)}>
                        Próxima
                    </Button>
                </div>
            )}
        </div>
    )
}
