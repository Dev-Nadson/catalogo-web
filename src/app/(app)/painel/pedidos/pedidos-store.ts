import { create } from "zustand"

import { PeriodosPedido, type PedidoFiltroStatus, type PeriodoPedido } from "~/lib/constants"

type PedidosFilters = {
    page: number
    search: string
    status: PedidoFiltroStatus
    periodo: PeriodoPedido
}

type PedidosStore = PedidosFilters & {
    clearFilters: () => void
    setPage: (page: number) => void
    setSearch: (search: string) => void
    setStatus: (status: PedidoFiltroStatus) => void
    setPeriodo: (periodo: PeriodoPedido) => void
}

const defaultStore: PedidosFilters = {
    page: 1,
    search: "",
    status: null,
    periodo: PeriodosPedido.TODOS,
}

/** Todo filtro volta para a primeira página: a página 3 de um resultado filtrado quase nunca existe. */
const usePedidos = create<PedidosStore>((set) => ({
    ...defaultStore,

    clearFilters: () => set({ status: defaultStore.status, periodo: defaultStore.periodo, page: 1 }),
    setPage: (page) => set({ page }),
    setSearch: (search) => set({ search, page: 1 }),
    setStatus: (status) => set({ status, page: 1 }),
    setPeriodo: (periodo) => set({ periodo, page: 1 }),
}))

export { usePedidos }
