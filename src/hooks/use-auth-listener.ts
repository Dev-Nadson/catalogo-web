import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { supabase } from "~/lib/supabase"

/**
 * Mantém o cache em sincronia com o Auth do Supabase (inclusive entre abas).
 *
 * O `setTimeout` é recomendação do próprio supabase-js: chamar o client dentro do callback
 * de `onAuthStateChange` pode travar a fila de eventos.
 */
export function useAuthListener() {
    const queryClient = useQueryClient()

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            setTimeout(() => {
                if (event === "SIGNED_OUT") {
                    queryClient.clear()
                    queryClient.setQueryData([QUERIES.GET_SESSION], null)
                    return
                }

                if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "PASSWORD_RECOVERY") {
                    queryClient.invalidateQueries({ queryKey: [QUERIES.GET_SESSION] })
                }
            }, 0)
        })

        return () => subscription.unsubscribe()
    }, [queryClient])
}
