"use client"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { APP_NAME } from "~/lib/constants"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "~/components/ui/sidebar"
import { TooltipProvider } from "~/components/ui/tooltip"
import { AppSidebar } from "~/components/app-sidebar"
import { BrandMark } from "~/components/brand-mark"
import { PedidosNotifier } from "~/components/pedidos-notifier"

type DashboardLayoutProps = {
    /** Lido do cookie `sidebar_state` no servidor, para não piscar ao carregar. */
    defaultOpen: boolean
    children: React.ReactNode
}

export function DashboardLayout({ defaultOpen, children }: DashboardLayoutProps) {
    const { data: configuracao } = useConfiguracao()

    return (
        <TooltipProvider>
            <PedidosNotifier />
            <SidebarProvider
                defaultOpen={defaultOpen}
                style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
            >
                <AppSidebar />
                <SidebarInset className="bg-background-muted">
                    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md md:hidden">
                        <SidebarTrigger />
                        <BrandMark className="size-7 rounded-lg" />
                        <span className="truncate font-semibold">{configuracao?.nome ?? APP_NAME}</span>
                    </header>
                    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 lg:p-8">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}
