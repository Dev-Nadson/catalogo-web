
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"

/**
 * Primitivos de listagem paginada pelo servidor. A paginação, a busca e os
 * filtros são todos server-side — aqui só existe apresentação.
 *
 * A composição esperada é:
 *
 * ```tsx
 * <ListRoot>
 *     <ListTable>
 *         <ListHeader>
 *             <ListRow className="hover:bg-transparent">
 *                 <ListHead>Nome</ListHead>
 *                 <ListHead className="w-0" />
 *             </ListRow>
 *         </ListHeader>
 *         <ListBody>
 *             {isPending ? <ListSkeletonRows cols={2} /> : ...}
 *         </ListBody>
 *     </ListTable>
 *     <ListFooter total={...} page={...} pages={...} onPageChange={...} />
 * </ListRoot>
 * ```
 */

function ListRoot({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="list-root"
            className={cn(
                "overflow-hidden rounded-xl border bg-card",
                className
            )}
            {...props}
        />
    )
}

function ListTable({ className, ...props }: React.ComponentProps<"table">) {
    return <Table data-slot="list-table" className={cn(className)} {...props} />
}

function ListHeader({ className, ...props }: React.ComponentProps<"thead">) {
    return (
        <TableHeader
            data-slot="list-header"
            className={cn("bg-muted/30", className)}
            {...props}
        />
    )
}

function ListHead({ className, ...props }: React.ComponentProps<"th">) {
    return (
        <TableHead
            data-slot="list-head"
            className={cn(
                "h-auto px-5 py-3 text-xs font-medium text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

function ListBody({ className, ...props }: React.ComponentProps<"tbody">) {
    return <TableBody data-slot="list-body" className={cn(className)} {...props} />
}

function ListRow({ className, ...props }: React.ComponentProps<"tr">) {
    return (
        <TableRow
            data-slot="list-row"
            className={cn("last:border-0", className)}
            {...props}
        />
    )
}

function ListCell({ className, ...props }: React.ComponentProps<"td">) {
    return (
        <TableCell
            data-slot="list-cell"
            className={cn("px-5 py-3 text-sm", className)}
            {...props}
        />
    )
}

type ListEmptyProps = React.ComponentProps<"td"> & {
    cols: number
}

function ListEmpty({ className, cols, children, ...props }: ListEmptyProps) {
    return (
        <TableRow className="border-0 hover:bg-transparent">
            <TableCell
                data-slot="list-empty"
                colSpan={cols}
                className={cn(
                    "px-5 py-12 text-center text-sm text-muted-foreground",
                    className
                )}
                {...props}
            >
                {children ?? "Nenhum registro encontrado."}
            </TableCell>
        </TableRow>
    )
}

type ListSkeletonRowsProps = {
    cols: number
    rows?: number
}

/**
 * Mantém a altura da tabela estável enquanto a primeira página carrega — sem
 * isso a página "pula" quando os dados chegam.
 */
function ListSkeletonRows({ cols, rows = 10 }: ListSkeletonRowsProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <ListRow key={rowIndex}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <ListCell key={colIndex}>
                            <Skeleton className="h-4 w-full" />
                        </ListCell>
                    ))}
                </ListRow>
            ))}
        </>
    )
}

/**
 * Janela de páginas ao redor da atual: no máximo duas de cada lado.
 */
function getPageWindow(page: number, pages: number) {
    const start = Math.max(1, page - 2)
    const end = Math.min(pages, page + 2)

    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => index + start)
}

/**
 * O botão de página não pode ser um quadrado de largura fixa: a partir de 1000
 * páginas o número tem 4 dígitos e vazava do `size-7` do `icon-sm` — o "1502"
 * aparecia cortado como "502". Com `h-7` + padding horizontal ele cresce com o
 * conteúdo, e o `min-w-7` mantém o dígito único do mesmo tamanho de antes.
 */
const PAGE_BUTTON_CLASSES = "min-w-7 px-2 tabular-nums"

type ListFooterProps = {
    className?: string
    total?: number
    page?: number
    pages?: number
    onPageChange?: (page: number) => void
}

function ListFooter({
    className,
    total,
    page = 1,
    pages = 1,
    onPageChange,
}: ListFooterProps) {
    const pageWindow = getPageWindow(page, pages)

    const showFirst = (pageWindow.at(0) ?? 1) > 1
    const showLast = pageWindow.at(-1) !== pages
    const dotsBefore = (pageWindow.at(0) ?? 1) > 2
    const dotsAfter = (pageWindow.at(-1) ?? 1) < pages - 1

    return (
        <div
            data-slot="list-footer"
            className={cn(
                "flex flex-col items-center justify-between gap-3 border-t px-5 py-3 sm:flex-row",
                className
            )}
        >
            <p className="text-sm text-muted-foreground">
                {total === undefined
                    ? "—"
                    : `${total.toLocaleString("pt-BR")} ${total === 1 ? "resultado" : "resultados"}`}
            </p>

            {/* `flex-wrap` porque com 4 dígitos a fileira inteira passa de 450px
                e estouraria a largura no celular. */}
            <div className="flex flex-wrap items-center justify-center gap-1">
                <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label="Página anterior"
                    disabled={page <= 1}
                    onClick={() => onPageChange?.(page - 1)}
                >
                    <ChevronLeft />
                </Button>

                {showFirst && (
                    <Button
                        size="sm"
                        variant="outline"
                        className={PAGE_BUTTON_CLASSES}
                        onClick={() => onPageChange?.(1)}
                    >
                        1
                    </Button>
                )}

                {dotsBefore && (
                    <span className="px-1 text-sm text-muted-foreground">…</span>
                )}

                {pageWindow.map((item) => (
                    <Button
                        key={item}
                        size="sm"
                        variant={item === page ? "default" : "outline"}
                        aria-current={item === page ? "page" : undefined}
                        className={PAGE_BUTTON_CLASSES}
                        onClick={() => onPageChange?.(item)}
                    >
                        {item}
                    </Button>
                ))}

                {dotsAfter && (
                    <span className="px-1 text-sm text-muted-foreground">…</span>
                )}

                {showLast && (
                    <Button
                        size="sm"
                        variant="outline"
                        className={PAGE_BUTTON_CLASSES}
                        onClick={() => onPageChange?.(pages)}
                    >
                        {pages}
                    </Button>
                )}

                <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label="Próxima página"
                    disabled={page >= pages}
                    onClick={() => onPageChange?.(page + 1)}
                >
                    <ChevronRight />
                </Button>
            </div>
        </div>
    )
}

export {
    ListRoot,
    ListTable,
    ListHeader,
    ListHead,
    ListBody,
    ListRow,
    ListCell,
    ListEmpty,
    ListSkeletonRows,
    ListFooter,
}
