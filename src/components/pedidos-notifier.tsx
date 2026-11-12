"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useRealtimePedidos } from "~/hooks/use-realtime-pedidos"
import { formatCurrency } from "~/lib/utils"

/**
 * Montado uma vez no painel: cada pedido novo atualiza listas e contador e aparece num aviso,
 * esteja a equipe em que tela estiver.
 */
export function PedidosNotifier() {
    const router = useRouter()

    useRealtimePedidos({
        onInsert: (pedido) => {
            toast.success(`Novo pedido #${pedido.numero}`, {
                description: `${pedido.cliente_nome} · ${formatCurrency(pedido.total)}`,
                duration: 15_000,
                action: { label: "Ver", onClick: () => router.push(`/painel/pedidos/${pedido.id}`) },
            })
        },
    })

    return null
}
