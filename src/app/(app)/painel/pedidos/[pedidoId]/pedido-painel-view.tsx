"use client"

import { useQuery } from "@tanstack/react-query"
import { Copy, SearchX } from "lucide-react"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { ApiError } from "~/lib/errors"
import { buildPedidoMensagem, buildWhatsAppUrl, whatsAppDoCliente } from "~/lib/mensagem"
import { QUERIES } from "~/lib/queries"
import { firstName, formatTimestamp } from "~/lib/utils"
import { getPedido } from "~/services/pedidos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { BackLink } from "~/components/back-link"
import { PedidoStatusBadge } from "~/components/badges"
import { PedidoInfo, PedidoItens } from "~/components/pedido-detalhes"
import { WhatsAppIcon } from "~/components/whatsapp-icon"
import { PedidoStatusActions } from "./pedido-status-actions"

type PedidoPainelViewProps = {
    pedidoId: string
}

export function PedidoPainelView({ pedidoId }: PedidoPainelViewProps) {
    const { data: configuracao } = useConfiguracao()

    // O PedidosNotifier do painel já invalida este pedido quando ele muda.
    const { data: pedido, isPending, error } = useQuery({
        queryKey: [QUERIES.GET_PEDIDO, { pedidoId }],
        queryFn: () => getPedido({ pedidoId }),
    })

    if (error instanceof ApiError && error.status === 404) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-muted-foreground">Pedido não encontrado.</p>
                <BackLink href="/painel/pedidos">Voltar aos pedidos</BackLink>
            </div>
        )
    }

    if (isPending || !pedido) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        )
    }

    const lojaNome = configuracao?.nome ?? ""
    const saudacao = `Olá, ${firstName(pedido.cliente_nome)}! Aqui é da ${lojaNome}, sobre o seu pedido #${pedido.numero}.`

    async function copiarResumo() {
        if (!pedido) return

        await navigator.clipboard.writeText(
            buildPedidoMensagem({ pedido, lojaNome, origin: window.location.origin })
        )
        toast.success("Resumo do pedido copiado.")
    }

    return (
        <>
            <BackLink href="/painel/pedidos">Pedidos</BackLink>

            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                            Pedido #{pedido.numero}
                        </h1>
                        <PedidoStatusBadge status={pedido.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Feito em {formatTimestamp(pedido.criado_em)}
                        {pedido.atualizado_em !== pedido.criado_em &&
                            ` · atualizado em ${formatTimestamp(pedido.atualizado_em)}`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="lg" onClick={copiarResumo}>
                        <Copy />
                        Copiar resumo
                    </Button>
                    <Button
                        size="lg"
                        render={
                            <a
                                href={buildWhatsAppUrl(whatsAppDoCliente(pedido.cliente_telefone), saudacao)}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        }
                    >
                        <WhatsAppIcon className="size-4" />
                        Conversar com {firstName(pedido.cliente_nome)}
                    </Button>
                </div>
            </header>

            <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
                <h2 className="text-sm font-semibold">Andamento</h2>
                <PedidoStatusActions pedido={pedido} />
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-2">
                <PedidoItens pedido={pedido} />
                <PedidoInfo pedido={pedido} mostrarCliente />
            </div>
        </>
    )
}
