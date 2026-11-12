import { AppProviders } from "~/components/providers/app-providers"
import { getConfiguracaoPublica } from "~/server/catalogo"

type AppLayoutProps = {
    children: React.ReactNode
}

/**
 * Tudo o que é tela. A configuração lida no servidor semeia o React Query: nome, cor e logo
 * aparecem já no primeiro HTML, sem piscar.
 */
export default async function AppLayout({ children }: AppLayoutProps) {
    const configuracao = await getConfiguracaoPublica()

    return <AppProviders configuracao={configuracao}>{children}</AppProviders>
}
