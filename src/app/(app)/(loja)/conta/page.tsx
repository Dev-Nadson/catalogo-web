import type { Metadata } from "next"

import { ContaDados } from "./conta-dados"

export const metadata: Metadata = {
    title: "Meus dados",
}

export default function ContaPage() {
    return <ContaDados />
}
