import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "~/typings/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

/**
 * Cliente do navegador. Guarda a sessão em cookie (e não no localStorage), para o `proxy.ts`
 * e a rota dos PDFs enxergarem o mesmo login.
 */
export const supabase = createBrowserClient<Database>(
    supabaseUrl || "http://localhost:54321",
    supabaseKey || "missing-publishable-key"
)
