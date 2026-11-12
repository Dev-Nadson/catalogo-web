import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "~/components/ui/button"

export default function NotFound() {
    return (
        <div className="grid min-h-svh place-items-center p-4">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-muted text-primary">
                    <Compass className="size-7" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
                <p className="text-sm text-muted-foreground">
                    O endereço pode ter mudado ou o produto saiu do catálogo.
                </p>
                <Button size="lg" render={<Link href="/" />}>
                    Ver o catálogo
                </Button>
            </div>
        </div>
    )
}
