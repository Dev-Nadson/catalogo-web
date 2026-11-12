import { CarrinhoSheet } from "~/components/loja/carrinho-sheet"
import { CarrinhoSync } from "~/components/loja/carrinho-sync"
import { LojaAviso } from "~/components/loja/loja-aviso"
import { SiteFooter } from "~/components/loja/site-footer"
import { SiteHeader } from "~/components/loja/site-header"

type LojaLayoutProps = {
    children: React.ReactNode
}

/** O site público: vitrine, produto, checkout e a conta do cliente. */
export default function LojaLayout({ children }: LojaLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col">
            <LojaAviso />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CarrinhoSheet />
            <CarrinhoSync />
        </div>
    )
}
