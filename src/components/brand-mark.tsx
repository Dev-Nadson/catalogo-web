"use client"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { fotoUrl } from "~/lib/fotos"
import { cn, initials } from "~/lib/utils"

type BrandMarkProps = {
    className?: string
}

/** Logo da loja (enviado em Configurações) ou, sem logo, as iniciais do nome na cor da marca. */
export function BrandMark({ className }: BrandMarkProps) {
    const { data: configuracao } = useConfiguracao()
    const logo = fotoUrl(configuracao?.logo_path)

    if (logo) {
        return (
            <img
                src={logo}
                alt={configuracao?.nome ?? "Logo"}
                className={cn("size-10 shrink-0 rounded-xl bg-white object-contain", className)}
            />
        )
    }

    return (
        <div
            className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground",
                className
            )}
            aria-hidden="true"
        >
            {initials(configuracao?.nome) || "•"}
        </div>
    )
}
