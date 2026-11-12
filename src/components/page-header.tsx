type PageHeaderProps = {
    title: string
    description?: string
    action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                    <p className="mt-1.5 max-w-2xl text-base text-muted-foreground">{description}</p>
                )}
            </div>
            {action}
        </header>
    )
}
