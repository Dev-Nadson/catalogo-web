"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, LoaderCircle, LogOut, Store } from "lucide-react"

import { useSession } from "~/hooks/use-session"
import { RoleLabels } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { canAccessSidebarItem, isSidebarItemActive, settingsNavItem } from "~/lib/sidebar"
import { deleteSession } from "~/services/sessions"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "~/components/ui/sidebar"
import { useCloseMobileSidebar } from "~/components/app-sidebar/use-close-mobile-sidebar"

const BUTTON_CLASSES = "text-muted-foreground group-data-[collapsible=icon]:size-10!"

export function SidebarFooterActions() {
    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const closeMobileSidebar = useCloseMobileSidebar()
    const { data: session } = useSession()
    const { isMobile, state, toggleSidebar } = useSidebar()

    const isCollapsed = !isMobile && state === "collapsed"
    const collapseLabel = isCollapsed ? "Expandir" : "Recolher"

    const { mutate: signOut, isPending: isSigningOut } = useMutation({
        mutationFn: deleteSession,
        onError: (error: unknown) => {
            console.error("Falha ao encerrar a sessão:", error)
        },
        onSettled: () => {
            queryClient.clear()
            queryClient.setQueryData([QUERIES.GET_SESSION], null)
            router.replace("/")
        },
    })

    return (
        <SidebarMenu>
            {session && (
                <SidebarMenuItem className="mb-1 rounded-lg bg-muted/60 px-3 py-2 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold">{session.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{RoleLabels[session.role]}</p>
                </SidebarMenuItem>
            )}

            {canAccessSidebarItem(settingsNavItem, session?.role) && (
                <SidebarMenuItem>
                    <SidebarMenuButton
                        tooltip={settingsNavItem.label}
                        isActive={isSidebarItemActive(pathname, settingsNavItem)}
                        onClick={closeMobileSidebar}
                        className={BUTTON_CLASSES}
                        render={<Link href={settingsNavItem.href} />}
                    >
                        <settingsNavItem.icon />
                        <span>{settingsNavItem.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}

            <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Ver a loja"
                    className={BUTTON_CLASSES}
                    render={<Link href="/" target="_blank" rel="noopener" />}
                >
                    <Store />
                    <span>Ver a loja</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="hidden md:block">
                <SidebarMenuButton tooltip={collapseLabel} onClick={toggleSidebar} className={BUTTON_CLASSES}>
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    <span>{collapseLabel}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Sair"
                    onClick={() => signOut()}
                    disabled={isSigningOut}
                    className={BUTTON_CLASSES}
                >
                    {isSigningOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
                    <span>Sair</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
