import { ADMIN_ROLES } from "~/lib/constants"
import { RequireRole } from "~/components/require-role"

type CategoriasLayoutProps = {
    children: React.ReactNode
}

export default function CategoriasLayout({ children }: CategoriasLayoutProps) {
    return <RequireRole roles={ADMIN_ROLES}>{children}</RequireRole>
}
