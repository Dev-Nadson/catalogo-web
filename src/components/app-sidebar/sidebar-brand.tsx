"use client"

import Link from "next/link"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { APP_NAME } from "~/lib/constants"
import { BrandMark } from "~/components/brand-mark"
import { useCloseMobileSidebar } from "~/components/app-sidebar/use-close-mobile-sidebar"

export function SidebarBrand() {
    const closeMobileSidebar = useCloseMobileSidebar()
    const { data: configuracao } = useConfiguracao()

    return (
        <Link
            href="/painel/pedidos"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/30"
        >
            <BrandMark />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-base font-semibold">{configuracao?.nome ?? APP_NAME}</span>
                <span className="block truncate text-xs text-muted-foreground">Painel da loja</span>
            </div>
        </Link>
    )
}
