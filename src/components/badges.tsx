import {
    PedidoStatusLabels,
    PedidoStatuses,
    RoleLabels,
    Roles,
    type PedidoStatus,
    type Role,
} from "~/lib/constants"
import { Badge } from "~/components/ui/badge"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const statusVariants: Record<PedidoStatus, BadgeVariant> = {
    [PedidoStatuses.NOVO]: "warning",
    [PedidoStatuses.EM_ATENDIMENTO]: "default",
    [PedidoStatuses.CONCLUIDO]: "success",
    [PedidoStatuses.CANCELADO]: "outline",
}

export function PedidoStatusBadge({ status }: { status: PedidoStatus }) {
    return <Badge variant={statusVariants[status]}>{PedidoStatusLabels[status]}</Badge>
}

const roleVariants: Record<Role, BadgeVariant> = {
    [Roles.CLIENTE]: "outline",
    [Roles.ATENDENTE]: "secondary",
    [Roles.ADMIN]: "default",
}

export function RoleBadge({ role }: { role: Role }) {
    return <Badge variant={roleVariants[role]}>{RoleLabels[role]}</Badge>
}
