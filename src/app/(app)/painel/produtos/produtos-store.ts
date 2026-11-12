import { create } from "zustand"

import { ProdutoFiltroStatuses, type ProdutoFiltroStatus } from "~/lib/constants"

type ProdutosFilters = {
    page: number
    search: string
    categoriaId: string | null
    status: ProdutoFiltroStatus
}

type ProdutosStore = ProdutosFilters & {
    clearFilters: () => void
    setPage: (page: number) => void
    setSearch: (search: string) => void
    setCategoriaId: (categoriaId: string | null) => void
    setStatus: (status: ProdutoFiltroStatus) => void
}

const defaultStore: ProdutosFilters = {
    page: 1,
    search: "",
    categoriaId: null,
    status: ProdutoFiltroStatuses.TODOS,
}

/** Todo filtro volta para a primeira página. */
const useProdutos = create<ProdutosStore>((set) => ({
    ...defaultStore,

    clearFilters: () => set({ categoriaId: defaultStore.categoriaId, status: defaultStore.status, page: 1 }),
    setPage: (page) => set({ page }),
    setSearch: (search) => set({ search, page: 1 }),
    setCategoriaId: (categoriaId) => set({ categoriaId, page: 1 }),
    setStatus: (status) => set({ status, page: 1 }),
}))

export { useProdutos }
