"use client"

import { Info, Truck } from "lucide-react"

import { resumoCarrinho } from "~/lib/carrinho"
import { cn, formatCurrency } from "~/lib/utils"
import type { Configuracao } from "~/services/configuracoes"

type CarrinhoAvisosProps = {
    subtotal: number
    configuracao: Configuracao
    className?: string
}

/** "Faltam R$ X para o pedido mínimo" e "Faltam R$ Y para o frete grátis", com a barra. */
export function CarrinhoAvisos({ subtotal, configuracao, className }: CarrinhoAvisosProps) {
    const resumo = resumoCarrinho(subtotal, configuracao.aceita_entrega ? "entrega" : null, configuracao)

    if (resumo.faltaParaMinimo > 0) {
        return (
            <p className={cn("flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning", className)}>
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                    O pedido mínimo é {formatCurrency(configuracao.pedido_minimo)}. Faltam{" "}
                    <b className="tabular-nums">{formatCurrency(resumo.faltaParaMinimo)}</b>.
                </span>
            </p>
        )
    }

    if (!configuracao.aceita_entrega || configuracao.frete_gratis_acima === null || configuracao.taxa_entrega === 0) {
        return null
    }

    const progresso = Math.min(100, (subtotal / configuracao.frete_gratis_acima) * 100)

    return (
        <div className={cn("flex flex-col gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm", className)}>
            <p className="flex items-center gap-2">
                <Truck className="size-4 shrink-0 text-primary" />
                {resumo.freteGratis ? (
                    <span className="font-medium">Seu pedido ganhou frete grátis!</span>
                ) : (
                    <span>
                        Faltam <b className="tabular-nums">{formatCurrency(resumo.faltaParaFreteGratis)}</b> para o
                        frete grátis.
                    </span>
                )}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progresso}%` }} />
            </div>
        </div>
    )
}
