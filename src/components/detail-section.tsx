export function DataField({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="min-w-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="mt-1 text-sm break-words">{children}</div>
        </div>
    )
}

export function Section({
    title,
    description,
    icon,
    action,
    children,
}: {
    title: string
    description?: string
    icon?: React.ReactNode
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        {icon}
                        {title}
                    </h2>
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    )
}
