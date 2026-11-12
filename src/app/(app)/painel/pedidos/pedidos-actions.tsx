"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import { useDebouncedCallback } from "~/hooks/use-debounced-callback"
import {
    FILTRO_EM_ABERTO,
    PEDIDO_STATUS_OPTIONS,
    PeriodoPedidoLabels,
    PeriodosPedido,
    type PedidoFiltroStatus,
    type PeriodoPedido,
    type SelectOption,
} from "~/lib/constants"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { FiltersPopover, FiltersPopoverField } from "~/components/filters-popover"
import { usePedidos } from "./pedidos-store"

const statusItems: SelectOption<PedidoFiltroStatus>[] = [
    { value: null, label: "Todos os status" },
    { value: FILTRO_EM_ABERTO, label: "Em aberto" },
    ...PEDIDO_STATUS_OPTIONS,
]

const periodoItems: SelectOption<PeriodoPedido>[] = Object.values(PeriodosPedido).map((periodo) => ({
    value: periodo,
    label: PeriodoPedidoLabels[periodo],
}))

export function PedidosActions() {
    const { search, status, periodo, setSearch, setStatus, setPeriodo, clearFilters } = usePedidos()

    // Campo não controlado: o valor inicial vem do store uma vez só, ao montar.
    const [initialSearch] = useState(search)

    const handleSearchChange = useDebouncedCallback((value: string) => {
        setSearch(value)
    })

    return (
        <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    aria-label="Buscar pedidos"
                    placeholder="Nº, nome ou telefone..."
                    className="h-10 bg-background pl-9"
                    defaultValue={initialSearch}
                    onChange={(event) => handleSearchChange(event.target.value)}
                />
            </div>

            <FiltersPopover
                hasActiveFilters={Boolean(status) || periodo !== PeriodosPedido.TODOS}
                onClear={clearFilters}
                align="end"
            >
                <FiltersPopoverField label="Status">
                    <Select items={statusItems} value={status} onValueChange={(value) => setStatus(value)}>
                        <SelectTrigger aria-label="Filtrar por status" className="h-9 w-full min-w-0 flex-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusItems.map((item) => (
                                <SelectItem key={String(item.value)} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FiltersPopoverField>
                <FiltersPopoverField label="Período">
                    <Select
                        items={periodoItems}
                        value={periodo}
                        onValueChange={(value) => value && setPeriodo(value)}
                    >
                        <SelectTrigger aria-label="Filtrar por período" className="h-9 w-full min-w-0 flex-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {periodoItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FiltersPopoverField>
            </FiltersPopover>
        </div>
    )
}
