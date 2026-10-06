import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="border border-dashed shadow-none ring-0">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
          <p className="text-sm font-medium">Nothing here yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This page is a placeholder. It will be built once the database is connected.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
