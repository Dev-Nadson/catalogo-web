"use client"

import { SlidersHorizontal } from "lucide-react"

import { Button } from "~/components/ui/button"
import { FieldLabel } from "~/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "~/components/ui/popover"

/**
 * Invólucro dos filtros de listagem: um botão "Filtros" que abre os campos empilhados. Só o
 * conteúdo muda de tela para tela.
 *
 * Os selects do Base UI vivem em portais, mas continuam descendentes React do popup — o
 * `useDismiss` marca isso como clique interno, então escolher um item não fecha o popover.
 */

type FiltersPopoverProps = {
    children: React.ReactNode
    /** Sem contador, é o `disabled` do "Limpar" que sinaliza filtro aplicado. */
    hasActiveFilters: boolean
    onClear: () => void
    align?: "start" | "end"
}

export function FiltersPopover({
    children,
    hasActiveFilters,
    onClear,
    align = "start",
}: FiltersPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger render={<Button variant="outline" size="lg" />}>
                <SlidersHorizontal />
                Filtros
                {hasActiveFilters && <span className="size-1.5 rounded-full bg-primary" />}
            </PopoverTrigger>

            <PopoverContent align={align} className="w-88 gap-3">
                <PopoverHeader className="flex-row items-center justify-between">
                    <PopoverTitle className="text-sm font-semibold">Filtros</PopoverTitle>
                    <Button
                        variant="ghost"
                        size="xs"
                        disabled={!hasActiveFilters}
                        onClick={onClear}
                    >
                        Limpar filtros
                    </Button>
                </PopoverHeader>

                {children}
            </PopoverContent>
        </Popover>
    )
}

type FiltersPopoverFieldProps = {
    label: string
    children: React.ReactNode
}

export function FiltersPopoverField({ label, children }: FiltersPopoverFieldProps) {
    return (
        <div className="flex items-center gap-3">
            <FieldLabel className="w-20 shrink-0">{label}</FieldLabel>
            {children}
        </div>
    )
}
