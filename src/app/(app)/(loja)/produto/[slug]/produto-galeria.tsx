"use client"

import { useRef, useState } from "react"

import { cn } from "~/lib/utils"
import { ProdutoFoto } from "~/components/loja/produto-foto"

type ProdutoGaleriaProps = {
    fotos: string[]
    nome: string
}

/**
 * Fotos lado a lado com scroll-snap: no celular, arrasta com o dedo; no desktop, as miniaturas
 * levam à foto. Nada de biblioteca de carrossel.
 */
export function ProdutoGaleria({ fotos, nome }: ProdutoGaleriaProps) {
    const trilhoRef = useRef<HTMLDivElement>(null)
    const [atual, setAtual] = useState(0)

    if (fotos.length <= 1) {
        return <ProdutoFoto path={fotos[0]} alt={nome} priority className="aspect-square w-full rounded-3xl" />
    }

    function irPara(index: number) {
        const trilho = trilhoRef.current

        trilho?.scrollTo({ left: trilho.clientWidth * index, behavior: "smooth" })
    }

    function handleScroll() {
        const trilho = trilhoRef.current

        if (trilho) setAtual(Math.round(trilho.scrollLeft / trilho.clientWidth))
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <div
                    ref={trilhoRef}
                    onScroll={handleScroll}
                    className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-3xl"
                >
                    {fotos.map((foto, index) => (
                        <ProdutoFoto
                            key={foto}
                            path={foto}
                            alt={`${nome} — foto ${index + 1}`}
                            priority={index === 0}
                            className="aspect-square w-full shrink-0 snap-center"
                        />
                    ))}
                </div>
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
                    {fotos.map((foto, index) => (
                        <span
                            key={foto}
                            className={cn(
                                "h-1.5 rounded-full bg-white/70 shadow transition-all",
                                index === atual ? "w-5 bg-white" : "w-1.5"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="hidden gap-2 sm:flex">
                {fotos.map((foto, index) => (
                    <button
                        key={foto}
                        type="button"
                        onClick={() => irPara(index)}
                        aria-label={`Ver foto ${index + 1}`}
                        className={cn(
                            "overflow-hidden rounded-xl ring-2 ring-transparent transition",
                            index === atual ? "ring-primary" : "opacity-70 hover:opacity-100"
                        )}
                    >
                        <ProdutoFoto path={foto} alt="" className="size-16" />
                    </button>
                ))}
            </div>
        </div>
    )
}
