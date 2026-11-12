"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LayoutDashboard, LogOut, Receipt, ShoppingBag, UserRound } from "lucide-react"

import { useCarrinhoDetalhado, useCarrinho } from "~/hooks/use-carrinho"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { useSession } from "~/hooks/use-session"
import { APP_NAME, isStaff } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { firstName } from "~/lib/utils"
import { deleteSession } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { BrandMark } from "~/components/brand-mark"

function ContaMenu() {
    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { data: session, isPending } = useSession()

    const { mutate: signOut } = useMutation({
        mutationFn: deleteSession,
        onError: (error: unknown) => console.error("Falha ao encerrar a sessão:", error),
        onSettled: () => {
            queryClient.clear()
            queryClient.setQueryData([QUERIES.GET_SESSION], null)
            router.replace("/")
        },
    })

    if (isPending) return <div className="size-9" />

    if (!session) {
        return (
            <Button
                variant="ghost"
                size="lg"
                className="rounded-full"
                render={<Link href={`/entrar?redirect=${encodeURIComponent(pathname)}`} />}
            >
                <UserRound />
                <span className="hidden sm:inline">Entrar</span>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="lg" className="rounded-full" />}>
                <UserRound />
                <span className="hidden max-w-32 truncate sm:inline">{firstName(session.nome)}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="truncate">{session.email}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push("/conta/pedidos")}>
                        <Receipt />
                        Meus pedidos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/conta")}>
                        <UserRound />
                        Meus dados
                    </DropdownMenuItem>
                    {isStaff(session.role) && (
                        <DropdownMenuItem onClick={() => router.push("/painel/pedidos")}>
                            <LayoutDashboard />
                            Painel da loja
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function CarrinhoButton() {
    const setAberto = useCarrinho((state) => state.setAberto)
    const { quantidadeTotal } = useCarrinhoDetalhado()

    return (
        <Button
            size="lg"
            className="relative rounded-full"
            aria-label={`Abrir carrinho (${quantidadeTotal} itens)`}
            onClick={() => setAberto(true)}
        >
            <ShoppingBag />
            <span className="hidden sm:inline">Carrinho</span>
            {quantidadeTotal > 0 && (
                <span
                    key={quantidadeTotal}
                    className="grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-primary-foreground px-1 text-xs font-bold text-primary tabular-nums"
                >
                    {quantidadeTotal}
                </span>
            )}
        </Button>
    )
}

export function SiteHeader() {
    const { data: configuracao } = useConfiguracao()

    return (
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
                <Link href="/" className="flex min-w-0 items-center gap-2.5">
                    <BrandMark className="size-9" />
                    <span className="truncate text-base font-semibold sm:text-lg">{configuracao?.nome ?? APP_NAME}</span>
                </Link>

                <nav className="flex shrink-0 items-center gap-1.5">
                    <ContaMenu />
                    <CarrinhoButton />
                </nav>
            </div>
        </header>
    )
}
