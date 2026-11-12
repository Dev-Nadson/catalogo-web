"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { useSession } from "~/hooks/use-session"
import { QUERIES } from "~/lib/queries"
import {
    filterSidebarNavItems,
    isSidebarItemActive,
    sidebarNavItems,
} from "~/lib/sidebar"
import { countPedidosNovos } from "~/services/pedidos"
import {
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"
import { useCloseMobileSidebar } from "~/components/app-sidebar/use-close-mobile-sidebar"

const ITEM_CLASSES =
    "h-10 gap-2.5 [&_svg]:size-4.5 group-data-[collapsible=icon]:size-10! data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary"

export function SidebarNav() {
    const pathname = usePathname()
    const closeMobileSidebar = useCloseMobileSidebar()
    const { data: session } = useSession()

    // O Realtime do painel (PedidosNotifier) invalida esta contagem a cada pedido.
    const { data: novos } = useQuery({
        queryKey: [QUERIES.COUNT_PEDIDOS_NOVOS],
        queryFn: () => countPedidosNovos(),
    })

    const navItems = filterSidebarNavItems(sidebarNavItems, session?.role)

    return (
        <SidebarMenu className="gap-1">
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        isActive={isSidebarItemActive(pathname, item)}
                        tooltip={item.label}
                        onClick={closeMobileSidebar}
                        className={ITEM_CLASSES}
                        render={<Link href={item.href} />}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.href === "/painel/pedidos" && Boolean(novos) && (
                        <SidebarMenuBadge className="top-2.5 rounded-full bg-primary px-1.5 text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-active/menu-button:text-primary-foreground">
                            {novos}
                        </SidebarMenuBadge>
                    )}
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}
