"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarSeparator,
} from "~/components/ui/sidebar"
import { SidebarBrand } from "~/components/app-sidebar/sidebar-brand"
import { SidebarFooterActions } from "~/components/app-sidebar/sidebar-footer-actions"
import { SidebarNav } from "~/components/app-sidebar/sidebar-nav"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="py-4">
                <SidebarBrand />
            </SidebarHeader>

            <SidebarSeparator className="mx-0" />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarNav />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator className="mx-0" />

            <SidebarFooter>
                <SidebarFooterActions />
            </SidebarFooter>
        </Sidebar>
    )
}
