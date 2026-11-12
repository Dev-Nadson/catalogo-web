import { useQuery } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { getConfiguracao } from "~/services/configuracoes"

/**
 * A configuração da loja (nome, cor, WhatsApp, regras de entrega). Transversal como a sessão:
 * quase toda tela lê. O layout do site semeia o cache com o que o servidor já leu
 * (`initialData`), então ela não pisca ao carregar.
 */
export function useConfiguracao() {
    return useQuery({
        queryKey: [QUERIES.GET_CONFIGURACAO],
        queryFn: () => getConfiguracao(),
        staleTime: 5 * 60_000,
    })
}
