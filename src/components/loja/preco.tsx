import { cn, formatCurrency } from "~/lib/utils"

type PrecoProps = {
    preco: number
    precoDe?: number | null
    aPartirDe?: boolean
    className?: string
    size?: "sm" | "lg"
}

/** Preço com o "de" riscado ao lado, quando há promoção. */
export function Preco({ preco, precoDe, aPartirDe = false, className, size = "sm" }: PrecoProps) {
    return (
        <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
            {aPartirDe && <span className="w-full text-xs text-muted-foreground">a partir de</span>}
            <span className={cn("font-semibold tabular-nums", size === "lg" ? "text-2xl" : "text-base")}>
                {formatCurrency(preco)}
            </span>
            {precoDe && precoDe > preco && (
                <span
                    className={cn(
                        "text-muted-foreground tabular-nums line-through",
                        size === "lg" ? "text-base" : "text-xs"
                    )}
                >
                    {formatCurrency(precoDe)}
                </span>
            )}
        </div>
    )
}

/** "-20%" no canto da foto. */
export function DescontoBadge({ preco, precoDe }: { preco: number; precoDe: number | null }) {
    if (!precoDe || precoDe <= preco) return null

    return (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">
            -{Math.round((1 - preco / precoDe) * 100)}%
        </span>
    )
}
