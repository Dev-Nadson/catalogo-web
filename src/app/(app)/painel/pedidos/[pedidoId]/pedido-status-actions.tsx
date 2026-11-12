"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleCheck, CircleX, Hand, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { PedidoStatusLabels, PedidoStatuses, type PedidoStatus } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { PROXIMOS_STATUS } from "~/lib/pedido"
import { invalidatePedidos, invalidateProdutos } from "~/lib/queries"
import { updatePedidoStatus, type Pedido } from "~/services/pedidos"
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

const ACOES: Record<PedidoStatus, { label: string; icon: typeof Hand; variant: "default" | "outline" | "ghost" }> = {
    [PedidoStatuses.EM_ATENDIMENTO]: { label: "Começar atendimento", icon: Hand, variant: "default" },
    [PedidoStatuses.CONCLUIDO]: { label: "Concluir pedido", icon: CircleCheck, variant: "outline" },
    [PedidoStatuses.NOVO]: { label: "Voltar para novo", icon: Undo2, variant: "ghost" },
    [PedidoStatuses.CANCELADO]: { label: "Cancelar pedido", icon: CircleX, variant: "ghost" },
}

type PedidoStatusActionsProps = {
    pedido: Pedido
}

/**
 * Os próximos passos do pedido. Quem confere a transição é o `pedidos_protect`; cancelar
 * devolve ao estoque o que o pedido tinha reservado.
 */
export function PedidoStatusActions({ pedido }: PedidoStatusActionsProps) {
    const queryClient = useQueryClient()
    const [confirmarCancelamento, setConfirmarCancelamento] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: updatePedidoStatus,
        onSuccess: (_, { status }) =>
            Promise.all([
                invalidatePedidos(queryClient),
                status === PedidoStatuses.CANCELADO && invalidateProdutos(queryClient),
            ]),
    })

    const proximos = PROXIMOS_STATUS[pedido.status]

    function mudar(status: PedidoStatus) {
        if (isPending) return

        toast.promise(mutateAsync({ pedidoId: pedido.id, status }), {
            loading: "Atualizando o pedido...",
            success: `Pedido #${pedido.numero}: ${PedidoStatusLabels[status].toLowerCase()}.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setConfirmarCancelamento(false)
    }

    if (!proximos.length) {
        return (
            <p className="text-sm text-muted-foreground">
                Pedido {PedidoStatusLabels[pedido.status].toLowerCase()}: não muda mais.
            </p>
        )
    }

    return (
        <div className="flex flex-wrap gap-2">
            {proximos
                .filter((status) => status !== PedidoStatuses.CANCELADO)
                .map((status) => {
                    const acao = ACOES[status]

                    return (
                        <Button
                            key={status}
                            size="lg"
                            variant={acao.variant}
                            disabled={isPending}
                            onClick={() => mudar(status)}
                        >
                            <acao.icon />
                            {acao.label}
                        </Button>
                    )
                })}

            <AlertDialog open={confirmarCancelamento} onOpenChange={setConfirmarCancelamento}>
                <AlertDialogTrigger
                    render={<Button size="lg" variant="ghost" className="text-destructive" disabled={isPending} />}
                >
                    <CircleX />
                    Cancelar
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar o pedido #{pedido.numero}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Os itens voltam para o estoque. Avise {pedido.cliente_nome} pelo WhatsApp. Esta ação não pode
                            ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Voltar</AlertDialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            size="lg"
                            onClick={() => mudar(PedidoStatuses.CANCELADO)}
                        >
                            Cancelar pedido
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
