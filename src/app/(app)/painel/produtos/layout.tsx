import { ADMIN_ROLES } from "~/lib/constants"
import { RequireRole } from "~/components/require-role"

type ProdutosLayoutProps = {
    children: React.ReactNode
}

export default function ProdutosLayout({ children }: ProdutosLayoutProps) {
    return <RequireRole roles={ADMIN_ROLES}>{children}</RequireRole>
}
