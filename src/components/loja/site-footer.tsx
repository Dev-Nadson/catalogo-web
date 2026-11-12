"use client"

import { AtSign, Clock, MapPin, MessageCircle } from "lucide-react"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { APP_NAME } from "~/lib/constants"
import { buildWhatsAppUrl } from "~/lib/mensagem"
import { formatPhone } from "~/lib/utils"

export function SiteFooter() {
    const { data: configuracao } = useConfiguracao()
    const nome = configuracao?.nome ?? APP_NAME

    const contatos = [
        configuracao?.horario && { icon: Clock, text: configuracao.horario },
        configuracao?.endereco && { icon: MapPin, text: configuracao.endereco },
        configuracao?.whatsapp && {
            icon: MessageCircle,
            text: formatPhone(configuracao.whatsapp.slice(2)),
            href: buildWhatsAppUrl(configuracao.whatsapp),
        },
        configuracao?.instagram && {
            icon: AtSign,
            text: `@${configuracao.instagram}`,
            href: `https://instagram.com/${configuracao.instagram}`,
        },
    ].filter((item): item is { icon: typeof Clock; text: string; href?: string } => Boolean(item))

    return (
        <footer className="border-t bg-background-muted">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:justify-between">
                <div className="max-w-sm">
                    <p className="text-lg font-semibold">{nome}</p>
                    {configuracao?.slogan && <p className="mt-1 text-sm text-muted-foreground">{configuracao.slogan}</p>}
                </div>

                {contatos.length > 0 && (
                    <ul className="flex flex-col gap-2.5 text-sm">
                        {contatos.map((contato) => (
                            <li key={contato.text} className="flex items-start gap-2.5">
                                <contato.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                                {contato.href ? (
                                    <a href={contato.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        {contato.text}
                                    </a>
                                ) : (
                                    <span className="whitespace-pre-line">{contato.text}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <p className="pb-8 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} {nome}
            </p>
        </footer>
    )
}
