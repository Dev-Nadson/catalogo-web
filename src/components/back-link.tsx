import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type BackLinkProps = {
    href: string
    children: React.ReactNode
}

export function BackLink({ href, children }: BackLinkProps) {
    return (
        <Link
            href={href}
            className="-mb-2 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft className="size-4" />
            {children}
        </Link>
    )
}
