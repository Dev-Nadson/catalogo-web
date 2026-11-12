"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Copy, PartyPopper, Repeat2, SearchX } from "lucide-react"
import { toast } from "sonner"

import { useCarrinho } from "~/hooks/use-carrinho"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { useRealtimePedidos } from "~/hooks/use-realtime-pedidos"
import { FormasPagamento, PedidoStatuses } from "~/lib/constants"
import { ApiError, describeMutationError } from "~/lib/errors"
import { ABRIR_WHATSAPP_KEY, buildPedidoMensagem, buildWhatsAppUrl } from "~/lib/mensagem"
import { canClienteCancelar } from "~/lib/pedido"
import { QUERIES, invalidatePedidos, invalidateProdutos } from "~/lib/queries"
import { formatCurrency, formatTimestamp } from "~/lib/utils"
import { getPedido, updatePedidoStatus, type Pedido } from "~/services/pedidos"
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { PedidoStatusBadge } from "~/components/badges"
import { PedidoEtapas, PedidoInfo, PedidoItens } from "~/components/pedido-detalhes"
import { WhatsAppIcon } from "~/components/whatsapp-icon"

type PedidoClienteViewProps = {
    pedidoId: string
    novo: boolean
}

function CancelarPedidoDialog({ pedido }: { pedido: Pedido }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: updatePedidoStatus,
        // Cancelar devolve o estoque: a vitrine também muda.
        onSuccess: () => Promise.all([invalidatePedidos(queryClient), invalidateProdutos(queryClient)]),
    })

    function handleCancelar() {
        if (isPending) return

        toast.promise(mutateAsync({ pedidoId: pedido.id, status: PedidoStatuses.CANCELADO }), {
            loading: "Cancelando o pedido...",
            success: `Pedido #${pedido.numero} cancelado.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setOpen(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<Button variant="ghost" size="lg" className="text-destructive" />}>
                Cancelar pedido
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar o pedido #{pedido.numero}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        A loja ainda não começou a atender. Se você já mandou a mensagem no WhatsApp, avise por lá
                        também.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Voltar</AlertDialogClose>
                    <Button type="button" variant="destructive" size="lg" onClick={handleCancelar}>
                        Cancelar pedido
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function PedidoClienteView({ pedidoId, novo }: PedidoClienteViewProps) {
    const router = useRouter()
    const adicionar = useCarrinho((state) => state.adicionar)
    const setAberto = useCarrinho((state) => state.setAberto)
    const { data: configuracao } = useConfiguracao()

    useRealtimePedidos({ pedidoId })

    const { data: pedido, isPending, error } = useQuery({
        queryKey: [QUERIES.GET_PEDIDO, { pedidoId }],
        queryFn: () => getPedido({ pedidoId }),
    })

    const whatsappUrl =
        pedido && configuracao?.whatsapp
            ? buildWhatsAppUrl(
                  configuracao.whatsapp,
                  buildPedidoMensagem({
                      pedido,
                      lojaNome: configuracao.nome,
                      origin: typeof window === "undefined" ? "" : window.location.origin,
                  })
              )
            : null

    // Celular: o checkout pediu para abrir o WhatsApp a partir daqui, uma vez só.
    useEffect(() => {
        if (!whatsappUrl || sessionStorage.getItem(ABRIR_WHATSAPP_KEY) !== pedidoId) return

        sessionStorage.removeItem(ABRIR_WHATSAPP_KEY)
        window.location.href = whatsappUrl
    }, [whatsappUrl, pedidoId])

    if (error instanceof ApiError && error.status === 404) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-muted-foreground">Pedido não encontrado.</p>
                <Button variant="outline" size="lg" render={<Link href="/conta/pedidos" />}>
                    Ver meus pedidos
                </Button>
            </div>
        )
    }

    if (isPending || !pedido) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        )
    }

    function pedirDeNovo() {
        if (!pedido) return

        for (const item of pedido.itens) adicionar(item.variacao_id, item.quantidade)

        setAberto(true)
        router.push("/")
    }

    async function copiarPix(chave: string) {
        await navigator.clipboard.writeText(chave)
        toast.success("Chave Pix copiada.")
    }

    const chavePix =
        pedido.forma_pagamento === FormasPagamento.PIX && pedido.status !== PedidoStatuses.CANCELADO
            ? configuracao?.chave_pix
            : null

    return (
        <div className="flex flex-col gap-5">
            <Button variant="ghost" size="sm" className="-ml-2 w-fit" render={<Link href="/conta/pedidos" />}>
                <ChevronLeft />
                Meus pedidos
            </Button>

            {novo && pedido.status === PedidoStatuses.NOVO && (
                <section className="flex animate-fade-up flex-col items-center gap-3 rounded-2xl bg-primary px-6 py-8 text-center text-primary-foreground">
                    <PartyPopper className="size-9" />
                    <h1 className="text-2xl font-semibold">Pedido #{pedido.numero} registrado!</h1>
                    <p className="max-w-md text-sm opacity-90">
                        Agora é só <b>enviar a mensagem no WhatsApp</b> da loja para ela confirmar. Se o WhatsApp não
                        abriu sozinho, toque no botão abaixo.
                    </p>
                    {whatsappUrl && (
                        <Button
                            size="xl"
                            variant="secondary"
                            className="mt-1 rounded-full"
                            render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}
                        >
                            <WhatsAppIcon />
                            Abrir no WhatsApp
                        </Button>
                    )}
                </section>
            )}

            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        {!novo && <h1 className="text-2xl font-semibold tabular-nums">Pedido #{pedido.numero}</h1>}
                        <p className="text-sm text-muted-foreground">Feito em {formatTimestamp(pedido.criado_em)}</p>
                    </div>
                    <PedidoStatusBadge status={pedido.status} />
                </div>
                <PedidoEtapas status={pedido.status} />
            </section>

            {chavePix && (
                <section className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
                    <h2 className="text-base font-semibold">Pagamento por Pix</h2>
                    <p className="text-sm text-muted-foreground">
                        Valor: <b className="text-foreground tabular-nums">{formatCurrency(pedido.total)}</b>. Confirme
                        com a loja antes de pagar e mande o comprovante pelo WhatsApp.
                    </p>
                    <div className="flex items-center gap-2 rounded-xl bg-muted p-2 pl-4">
                        <code className="min-w-0 flex-1 truncate font-mono text-sm">{chavePix}</code>
                        <Button size="lg" variant="outline" onClick={() => copiarPix(chavePix)}>
                            <Copy />
                            Copiar
                        </Button>
                    </div>
                </section>
            )}

            <PedidoItens pedido={pedido} />
            <PedidoInfo pedido={pedido} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                {canClienteCancelar(pedido.status) ? <CancelarPedidoDialog pedido={pedido} /> : <span />}
                <div className="flex flex-col gap-2 sm:flex-row">
                    {!novo && whatsappUrl && pedido.status !== PedidoStatuses.CANCELADO && (
                        <Button
                            variant="outline"
                            size="lg"
                            render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}
                        >
                            <WhatsAppIcon className="size-4" />
                            Reenviar no WhatsApp
                        </Button>
                    )}
                    <Button size="lg" onClick={pedirDeNovo}>
                        <Repeat2 />
                        Pedir de novo
                    </Button>
                </div>
            </div>
        </div>
    )
}
