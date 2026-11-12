"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { PackagePlus, Search } from "lucide-react"

import { useDebouncedCallback } from "~/hooks/use-debounced-callback"
import {
    ProdutoFiltroStatusLabels,
    ProdutoFiltroStatuses,
    type ProdutoFiltroStatus,
    type SelectOption,
} from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { listCategorias } from "~/services/categorias"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { FiltersPopover, FiltersPopoverField } from "~/components/filters-popover"
import { useProdutos } from "./produtos-store"

const statusItems: SelectOption<ProdutoFiltroStatus>[] = Object.values(ProdutoFiltroStatuses).map((status) => ({
    value: status,
    label: ProdutoFiltroStatusLabels[status],
}))

export function ProdutosActions() {
    const { search, categoriaId, status, setSearch, setCategoriaId, setStatus, clearFilters } = useProdutos()

    const { data: categorias } = useQuery({
        queryKey: [QUERIES.LIST_CATEGORIAS],
        queryFn: () => listCategorias(),
    })

    const categoriaItems: SelectOption<string | null>[] = [
        { value: null, label: "Todas" },
        ...(categorias ?? []).map((categoria) => ({ value: categoria.id, label: categoria.nome })),
    ]

    // Campo não controlado: o valor inicial vem do store uma vez só, ao montar.
    const [initialSearch] = useState(search)

    const handleSearchChange = useDebouncedCallback((value: string) => {
        setSearch(value)
    })

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="Buscar produtos"
                        placeholder="Buscar pelo nome..."
                        className="h-10 bg-background pl-9"
                        defaultValue={initialSearch}
                        onChange={(event) => handleSearchChange(event.target.value)}
                    />
                </div>

                <FiltersPopover
                    hasActiveFilters={Boolean(categoriaId) || status !== ProdutoFiltroStatuses.TODOS}
                    onClear={clearFilters}
                >
                    <FiltersPopoverField label="Categoria">
                        <Select items={categoriaItems} value={categoriaId} onValueChange={(value) => setCategoriaId(value)}>
                            <SelectTrigger aria-label="Filtrar por categoria" className="h-9 w-full min-w-0 flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categoriaItems.map((item) => (
                                    <SelectItem key={String(item.value)} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FiltersPopoverField>
                    <FiltersPopoverField label="Situação">
                        <Select items={statusItems} value={status} onValueChange={(value) => value && setStatus(value)}>
                            <SelectTrigger aria-label="Filtrar por situação" className="h-9 w-full min-w-0 flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusItems.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FiltersPopoverField>
                </FiltersPopover>
            </div>

            <Button size="lg" className="sm:ml-auto" render={<Link href="/painel/produtos/novo" />}>
                <PackagePlus />
                Novo produto
            </Button>
        </div>
    )
}
