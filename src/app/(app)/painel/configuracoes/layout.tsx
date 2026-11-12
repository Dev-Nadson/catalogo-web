import { ADMIN_ROLES } from "~/lib/constants"
import { RequireRole } from "~/components/require-role"

type ConfiguracoesLayoutProps = {
    children: React.ReactNode
}

export default function ConfiguracoesLayout({ children }: ConfiguracoesLayoutProps) {
    return <RequireRole roles={ADMIN_ROLES}>{children}</RequireRole>
}
