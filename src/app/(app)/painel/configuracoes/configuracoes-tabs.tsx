"use client"

import { Store, Truck, Users } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { ConfiguracoesEntrega } from "./configuracoes-entrega"
import { ConfiguracoesEquipe } from "./configuracoes-equipe"
import { ConfiguracoesLoja } from "./configuracoes-loja"

const TABS = [
    { value: "loja", label: "Loja", icon: Store, content: ConfiguracoesLoja },
    { value: "entrega", label: "Entrega e pagamento", icon: Truck, content: ConfiguracoesEntrega },
    { value: "equipe", label: "Equipe", icon: Users, content: ConfiguracoesEquipe },
]

export function ConfiguracoesTabs() {
    return (
        <Tabs defaultValue="loja" className="gap-5">
            <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="h-9 flex-none px-3.5">
                        <tab.icon />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    <tab.content />
                </TabsContent>
            ))}
        </Tabs>
    )
}
