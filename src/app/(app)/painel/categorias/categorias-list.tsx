"use client"

import { useQuery } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { listCategorias } from "~/services/categorias"
import {
    ListBody,
    ListCell,
    ListEmpty,
    ListHead,
    ListHeader,
    ListRoot,
    ListRow,
    ListSkeletonRows,
    ListTable,
} from "~/components/ui/list"
import { CategoriaDialog } from "./categoria-dialog"
import { DeleteCategoriaDialog } from "./delete-categoria-dialog"

const COLUMNS = 3

export function CategoriasList() {
    const { data: categorias, isPending } = useQuery({
        queryKey: [QUERIES.LIST_CATEGORIAS],
        queryFn: () => listCategorias(),
    })

    return (
        <ListRoot>
            <ListTable>
                <ListHeader>
                    <ListRow className="hover:bg-transparent">
                        <ListHead className="w-20">Ordem</ListHead>
                        <ListHead>Categoria</ListHead>
                        <ListHead className="text-right">Ações</ListHead>
                    </ListRow>
                </ListHeader>
                <ListBody>
                    {isPending && <ListSkeletonRows cols={COLUMNS} />}

                    {!isPending && !categorias?.length && (
                        <ListEmpty cols={COLUMNS}>
                            Nenhuma categoria ainda. Sem categoria, a vitrine mostra todos os produtos juntos.
                        </ListEmpty>
                    )}

                    {categorias?.map((categoria) => (
                        <ListRow key={categoria.id}>
                            <ListCell className="text-muted-foreground tabular-nums">{categoria.ordem}</ListCell>
                            <ListCell className="font-medium">{categoria.nome}</ListCell>
                            <ListCell>
                                <div className="flex items-center justify-end gap-1">
                                    <CategoriaDialog categoria={categoria} />
                                    <DeleteCategoriaDialog categoria={categoria} />
                                </div>
                            </ListCell>
                        </ListRow>
                    ))}
                </ListBody>
            </ListTable>
        </ListRoot>
    )
}
