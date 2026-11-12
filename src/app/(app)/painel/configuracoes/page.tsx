import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { ConfiguracoesTabs } from "./configuracoes-tabs"

export const metadata: Metadata = {
    title: "Configurações",
}

export default function ConfiguracoesPage() {
    return (
        <>
            <PageHeader
                title="Configurações"
                description="A loja, as regras de entrega e pagamento e quem trabalha no painel."
            />
            <ConfiguracoesTabs />
        </>
    )
}
