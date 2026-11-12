"use client"

import { Bike, Clock, Store, Wallet } from "lucide-react"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { APP_NAME } from "~/lib/constants"
import { cn, formatCurrency } from "~/lib/utils"

/** Nome, slogan e as regras que o cliente quer saber antes de escolher: entrega, mínimo, horário. */
export function VitrineHero() {
    const { data: configuracao } = useConfiguracao()

    if (!configuracao) {
        return (
            <section className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4">
                <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
            </section>
        )
    }

    const entrega = configuracao.aceita_entrega
        ? configuracao.taxa_entrega === 0
            ? "Entrega grátis"
            : `Entrega ${formatCurrency(configuracao.taxa_entrega)}${
                  configuracao.frete_gratis_acima
                      ? ` · grátis acima de ${formatCurrency(configuracao.frete_gratis_acima)}`
                      : ""
              }`
        : null

    const pills = [
        {
            icon: Clock,
            text: configuracao.aberta ? "Aberto agora" : "Fechado agora",
            className: configuracao.aberta ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
        },
        entrega && { icon: Bike, text: entrega },
        configuracao.aceita_retirada && { icon: Store, text: "Retirada na loja" },
        configuracao.pedido_minimo > 0 && {
            icon: Wallet,
            text: `Pedido mínimo ${formatCurrency(configuracao.pedido_minimo)}`,
        },
    ].filter((pill): pill is { icon: typeof Clock; text: string; className?: string } => Boolean(pill))

    return (
        <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_100%_at_0%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]" />
            <div className="mx-auto flex w-full max-w-6xl animate-fade-up flex-col gap-4 px-4 pt-8 pb-6 sm:pt-12">
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{configuracao.nome}</h1>
                {configuracao.slogan && (
                    <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{configuracao.slogan}</p>
                )}
                <ul className="flex flex-wrap gap-2">
                    {pills.map((pill) => (
                        <li
                            key={pill.text}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium shadow-xs ring-1 ring-border sm:text-sm",
                                pill.className
                            )}
                        >
                            <pill.icon className="size-3.5" />
                            {pill.text}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
