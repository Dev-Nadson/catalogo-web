import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { CategoriaDialog } from "./categoria-dialog"
import { CategoriasList } from "./categorias-list"

export const metadata: Metadata = {
    title: "Categorias",
}

export default function CategoriasPage() {
    return (
        <>
            <PageHeader
                title="Categorias"
                description="Organizam a vitrine em seções e viram os filtros que o cliente toca."
                action={<CategoriaDialog />}
            />
            <CategoriasList />
        </>
    )
}
