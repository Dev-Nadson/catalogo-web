import { FolderTree, Package, Receipt, Settings } from "lucide-react"

import { ADMIN_ROLES, STAFF_ROLES, isStaff, type Role } from "~/lib/constants"

export type SidebarIcon = React.ComponentType<{ className?: string }>

export type SidebarNavItem = {
    label: string
    href: string
    icon: SidebarIcon
    /** Mantém o item ativo também nas sub-rotas (ex.: /painel/produtos/42). */
    matchNested?: boolean
    roles?: readonly Role[]
}

/** As áreas do dia a dia. Configurações fica à parte, no rodapé. */
export const sidebarNavItems: SidebarNavItem[] = [
    {
        label: "Pedidos",
        href: "/painel/pedidos",
        icon: Receipt,
        matchNested: true,
        roles: STAFF_ROLES,
    },
    {
        label: "Produtos",
        href: "/painel/produtos",
        icon: Package,
        matchNested: true,
        roles: ADMIN_ROLES,
    },
    {
        label: "Categorias",
        href: "/painel/categorias",
        icon: FolderTree,
        roles: ADMIN_ROLES,
    },
]

export const settingsNavItem: SidebarNavItem = {
    label: "Configurações",
    href: "/painel/configuracoes",
    icon: Settings,
    matchNested: true,
    roles: ADMIN_ROLES,
}

function normalizePath(path: string) {
    if (path.length > 1 && path.endsWith("/")) {
        return path.slice(0, -1)
    }

    return path
}

export function isSidebarItemActive(pathname: string, item: SidebarNavItem) {
    const current = normalizePath(pathname)
    const href = normalizePath(item.href)

    if (current === href) {
        return true
    }

    if (!item.matchNested) {
        return false
    }

    return current.startsWith(`${href}/`)
}

export function canAccessSidebarItem(item: SidebarNavItem, role: Role | undefined) {
    if (!item.roles) {
        return true
    }

    return role !== undefined && item.roles.includes(role)
}

export function filterSidebarNavItems(items: SidebarNavItem[], role: Role | undefined) {
    return items.filter((item) => canAccessSidebarItem(item, role))
}

/** A equipe começa pelos pedidos; o cliente, pela vitrine. */
export function getHomePath(role: Role | undefined) {
    return isStaff(role) ? "/painel/pedidos" : "/"
}
