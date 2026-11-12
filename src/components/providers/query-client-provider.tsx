"use client"

import { useState } from "react"
import {
    QueryClient,
    QueryClientProvider as QueryClientProviderPrimitive,
} from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import type { Configuracao } from "~/services/configuracoes"

type QueryClientProviderProps = {
    /** A configuração que o servidor já leu: entra no cache antes da primeira tela. */
    configuracao: Configuracao | null
    children: React.ReactNode
}

export function QueryClientProvider({ configuracao, children }: QueryClientProviderProps) {
    const [client] = useState(() => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 60_000,
                    retry: 1,
                },
            },
        })

        // Pode ter até 1 min (revalidate do layout raiz): mostra já, mas conta como velho para
        // o navegador buscar a versão atual assim que a tela montar.
        if (configuracao) queryClient.setQueryData([QUERIES.GET_CONFIGURACAO], configuracao, { updatedAt: 0 })

        return queryClient
    })

    return (
        <QueryClientProviderPrimitive client={client}>
            {children}
        </QueryClientProviderPrimitive>
    )
}
