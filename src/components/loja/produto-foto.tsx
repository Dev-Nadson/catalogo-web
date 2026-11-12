"use client"

import { useState } from "react"
import { Package } from "lucide-react"

import { fotoUrl } from "~/lib/fotos"
import { cn } from "~/lib/utils"

type ProdutoFotoProps = {
    /** Caminho no bucket. Sem foto (ou com erro ao carregar), mostra o ícone. */
    path: string | null | undefined
    alt: string
    className?: string
    /** A primeira dobra da vitrine carrega já; o resto, quando chegar perto da tela. */
    priority?: boolean
}

export function ProdutoFoto({ path, alt, className, priority = false }: ProdutoFotoProps) {
    const [falhou, setFalhou] = useState(false)
    const src = fotoUrl(path)

    if (!src || falhou) {
        return (
            <div className={cn("grid place-items-center bg-muted text-muted-foreground/50", className)}>
                <Package className="size-1/4 min-h-6 min-w-6" strokeWidth={1.25} aria-hidden="true" />
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFalhou(true)}
            className={cn("bg-muted object-cover", className)}
        />
    )
}
