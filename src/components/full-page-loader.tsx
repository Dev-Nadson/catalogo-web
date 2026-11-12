import { LoaderCircle } from "lucide-react"

export function FullPageLoader() {
    return (
        <div className="grid min-h-svh place-items-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-label="Carregando" />
        </div>
    )
}
