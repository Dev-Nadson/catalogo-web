"use client"

import { useEffect } from "react"

import { useAuthListener } from "~/hooks/use-auth-listener"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { brandStyle } from "~/lib/cor"
import { isSupabaseConfigured } from "~/lib/supabase"
import type { Configuracao } from "~/services/configuracoes"
import { Toaster } from "~/components/ui/sonner"
import { MissingConfig } from "~/components/missing-config"
import { QueryClientProvider } from "~/components/providers/query-client-provider"

function AuthListener() {
    useAuthListener()

    return null
}

/**
 * O `<body>` já sai do servidor com a cor da loja (layout raiz). Isto só acompanha a troca de
 * cor feita no painel, sem recarregar. Fica no `<body>` (e não num wrapper) porque diálogos e
 * gavetas são portais direto no body.
 */
function BrandColorSync() {
    const { data: configuracao } = useConfiguracao()
    const cor = configuracao?.cor
    const corEscura = configuracao?.cor_escura

    useEffect(() => {
        if (!cor) return

        for (const [name, value] of Object.entries(brandStyle(cor, corEscura))) {
            document.body.style.setProperty(name, String(value))
        }
    }, [cor, corEscura])

    return null
}

type AppProvidersProps = {
    configuracao: Configuracao | null
    children: React.ReactNode
}

/** Equivalente ao `main.tsx` + `app.tsx` dos irmãos: React Query, sessão, cor da loja e toasts. */
export function AppProviders({ configuracao, children }: AppProvidersProps) {
    return (
        <>
            {isSupabaseConfigured ? (
                <QueryClientProvider configuracao={configuracao}>
                    <AuthListener />
                    <BrandColorSync />
                    {children}
                </QueryClientProvider>
            ) : (
                <MissingConfig />
            )}
            <Toaster position="top-center" richColors />
        </>
    )
}
