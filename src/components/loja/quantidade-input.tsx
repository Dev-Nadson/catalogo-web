"use client"

import { Minus, Plus, Trash2 } from "lucide-react"

import { LIMITS } from "~/lib/constants"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"

type QuantidadeInputProps = {
    value: number
    onChange: (value: number) => void
    /** Estoque disponível; `null` = sem controle (vale o limite de 99 por item). */
    max?: number | null
    /** No carrinho, o "−" no 1 vira lixeira e remove o item. */
    onRemove?: () => void
    size?: "sm" | "lg"
    className?: string
    label: string
}

export function QuantidadeInput({ value, onChange, max, onRemove, size = "sm", className, label }: QuantidadeInputProps) {
    const limite = Math.min(LIMITS.QUANTIDADE, max ?? LIMITS.QUANTIDADE)
    const buttonSize = size === "lg" ? "icon-lg" : "icon-sm"
    const removendo = Boolean(onRemove) && value <= 1

    return (
        <div
            role="group"
            aria-label={label}
            className={cn("inline-flex items-center rounded-full border bg-background", className)}
        >
            <Button
                type="button"
                variant="ghost"
                size={buttonSize}
                className="rounded-full"
                aria-label={removendo ? "Remover do carrinho" : "Diminuir"}
                disabled={!removendo && value <= 1}
                onClick={() => (removendo ? onRemove?.() : onChange(value - 1))}
            >
                {removendo ? <Trash2 /> : <Minus />}
            </Button>
            <span
                className={cn("min-w-7 text-center font-medium tabular-nums", size === "lg" && "min-w-9 text-base")}
                aria-live="polite"
            >
                {value}
            </span>
            <Button
                type="button"
                variant="ghost"
                size={buttonSize}
                className="rounded-full"
                aria-label="Aumentar"
                disabled={value >= limite}
                onClick={() => onChange(value + 1)}
            >
                <Plus />
            </Button>
        </div>
    )
}
