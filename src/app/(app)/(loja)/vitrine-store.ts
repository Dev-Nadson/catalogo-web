import { create } from "zustand"

type VitrineFiltros = {
    busca: string
    categoriaId: string | null
}

type VitrineStore = VitrineFiltros & {
    reset: () => void
    setBusca: (busca: string) => void
    setCategoriaId: (categoriaId: string | null) => void
}

const defaultStore: VitrineFiltros = {
    busca: "",
    categoriaId: null,
}

/** Fica entre navegações: voltar do produto para a vitrine mantém a busca e a categoria. */
const useVitrine = create<VitrineStore>((set) => ({
    ...defaultStore,

    reset: () => set(defaultStore),
    setBusca: (busca) => set({ busca }),
    setCategoriaId: (categoriaId) => set({ categoriaId }),
}))

export { useVitrine }
