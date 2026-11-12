import { useQuery } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { getSessionMe } from "~/services/sessions"

/**
 * Sessão + perfil. Não expira sozinha: o `useAuthListener` invalida quando o Supabase avisa
 * que o usuário entrou, saiu ou teve o token renovado.
 */
export function useSession() {
    return useQuery({
        queryKey: [QUERIES.GET_SESSION],
        queryFn: () => getSessionMe(),
        staleTime: Number.POSITIVE_INFINITY,
    })
}
