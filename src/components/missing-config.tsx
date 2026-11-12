import { TriangleAlert } from "lucide-react"

/** Mostrada no lugar do app quando o `.env.local` ainda não tem as chaves do Supabase. */
export function MissingConfig() {
    return (
        <div className="grid min-h-svh place-items-center p-4">
            <div className="flex max-w-md flex-col gap-3 rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 text-warning">
                    <TriangleAlert className="size-5" />
                    <h1 className="text-lg font-bold">Supabase não configurado</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Copie o <code className="font-mono">.env.example</code> para{" "}
                    <code className="font-mono">.env.local</code>, preencha com os dados de{" "}
                    <b>Project Settings &gt; API</b> e reinicie o servidor de desenvolvimento.
                </p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                    {"NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...\nAPP_URL=http://localhost:3000"}
                </pre>
            </div>
        </div>
    )
}
