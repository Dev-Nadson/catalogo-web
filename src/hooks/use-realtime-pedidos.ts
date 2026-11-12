import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { invalidatePedidos } from "~/lib/queries"
import { supabase } from "~/lib/supabase"
import type { Pedido } from "~/services/pedidos"

type UseRealtimePedidosOptions = {
    /** Só este pedido (a tela do cliente). Sem id, todos os que o RLS deixa ver. */
    pedidoId?: string
    /** Chamado a cada pedido novo (o aviso do painel). */
    onInsert?: (pedido: Pedido) => void
}

/**
 * Mantém as telas de pedido em dia sem recarregar. O Realtime respeita o RLS: a equipe recebe
 * todos, o cliente só os dele. Precisa de `pedidos` na publicação `supabase_realtime`
 * (schema.sql, seção 7).
 */
export function useRealtimePedidos({ pedidoId, onInsert }: UseRealtimePedidosOptions = {}) {
    const queryClient = useQueryClient()
    const onInsertRef = useRef(onInsert)

    useEffect(() => {
        onInsertRef.current = onInsert
    }, [onInsert])

    useEffect(() => {
        const channel = supabase
            .channel(`pedidos-realtime-${pedidoId ?? "todos"}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "pedidos",
                    ...(pedidoId && { filter: `id=eq.${pedidoId}` }),
                },
                (payload) => {
                    invalidatePedidos(queryClient)

                    if (payload.eventType === "INSERT") onInsertRef.current?.(payload.new as Pedido)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [pedidoId, queryClient])
}
