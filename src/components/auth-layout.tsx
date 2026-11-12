"use client"

import Link from "next/link"
import { MessageCircle, PackageCheck, ShoppingBag } from "lucide-react"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { APP_NAME } from "~/lib/constants"
import { BrandMark } from "~/components/brand-mark"

const HIGHLIGHTS = [
    { icon: ShoppingBag, text: "Monte o pedido com calma, o carrinho fica guardado" },
    { icon: MessageCircle, text: "O pedido chega pronto no WhatsApp da loja" },
    { icon: PackageCheck, text: "Acompanhe o status de cada pedido na sua conta" },
]

type AuthLayoutProps = {
    title: string
    description: string
    children: React.ReactNode
    footer?: React.ReactNode
}

/** Moldura das telas de acesso: painel na cor da loja à esquerda (desktop) e formulário à direita. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
    const { data: configuracao } = useConfiguracao()
    const nome = configuracao?.nome ?? APP_NAME

    return (
        <div className="flex min-h-svh flex-1">
            <div className="relative isolate hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgb(255_255_255/0.18)_0%,transparent_60%)]" />

                <Link href="/" className="flex items-center gap-3">
                    <BrandMark className="ring-1 ring-white/30" />
                    <span className="text-xl font-semibold">{nome}</span>
                </Link>

                <div className="flex flex-col gap-8">
                    <h1 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">
                        {configuracao?.slogan ?? "Escolha, monte o carrinho e envie seu pedido."}
                    </h1>
                    <ul className="flex flex-col gap-4">
                        {HIGHLIGHTS.map((item) => (
                            <li key={item.text} className="flex items-center gap-3 opacity-90">
                                <item.icon className="size-5 shrink-0" />
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </div>

                <Link href="/" className="text-sm opacity-70 hover:opacity-100">
                    ← Voltar ao catálogo
                </Link>
            </div>

            <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-8">
                <div className="mx-auto w-full max-w-md">
                    <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
                        <BrandMark className="size-9" />
                        <span className="text-lg font-semibold">{nome}</span>
                    </Link>

                    <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
                    <p className="mt-1.5 text-base text-muted-foreground">{description}</p>

                    <div className="mt-8">{children}</div>

                    {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
                </div>
            </div>
        </div>
    )
}
