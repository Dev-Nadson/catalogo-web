"use client"

import { Info, Moon } from "lucide-react"

import { useConfiguracao } from "~/hooks/use-configuracao"

/** Faixa no topo: loja fechada (pedido bloqueado) e o aviso livre que o admin escreve. */
export function LojaAviso() {
    const { data: configuracao } = useConfiguracao()

    if (!configuracao) return null

    return (
        <>
            {!configuracao.aberta && (
                <div className="bg-warning-soft text-warning">
                    <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm">
                        <Moon className="size-4 shrink-0" />
                        <span>
                            <b>Estamos fechados agora.</b> Você pode montar o carrinho e enviar quando abrirmos
                            {configuracao.horario ? ` (${configuracao.horario})` : ""}.
                        </span>
                    </p>
                </div>
            )}
            {configuracao.aviso && (
                <div className="bg-primary text-primary-foreground">
                    <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm">
                        <Info className="size-4 shrink-0" />
                        {configuracao.aviso}
                    </p>
                </div>
            )}
        </>
    )
}
