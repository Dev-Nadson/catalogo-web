"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Receipt, UserRound } from "lucide-react"

import { cn } from "~/lib/utils"

const LINKS = [
    { href: "/conta/pedidos", label: "Meus pedidos", icon: Receipt, nested: true },
    { href: "/conta", label: "Meus dados", icon: UserRound, nested: false },
]

export function ContaNav() {
    const pathname = usePathname()

    return (
        <nav className="flex w-fit gap-1 rounded-full bg-muted p-1" aria-label="Minha conta">
            {LINKS.map((link) => {
                const ativo = link.nested ? pathname.startsWith(link.href) : pathname === link.href

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                            "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
                            ativo ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <link.icon className="size-4" />
                        {link.label}
                    </Link>
                )
            })}
        </nav>
    )
}
