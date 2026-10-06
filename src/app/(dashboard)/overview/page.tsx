import type { Metadata } from "next"
import { FileCheck2, ImageOff, Link2, ListChecks, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { currentUser, currentWorkspace, overviewStats, sponsors } from "@/lib/demo-data"

export const metadata: Metadata = { title: "Overview" }

const stats: { label: string; icon: LucideIcon; value: number; detail: string }[] = [
  { label: "Obligations due this week", icon: ListChecks, ...overviewStats.obligationsDueThisWeek },
  { label: "Assets missing", icon: ImageOff, ...overviewStats.assetsMissing },
  { label: "Upload links awaiting partners", icon: Link2, ...overviewStats.uploadLinksAwaiting },
  { label: "Proof collected", icon: FileCheck2, ...overviewStats.proofCollected },
]

export default function OverviewPage() {
  const firstName = currentUser.name.split(" ")[0]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">{currentWorkspace.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border shadow-none ring-0">
            <CardHeader>
              <CardDescription className="flex items-center justify-between gap-2">
                <span>{stat.label}</span>
                <stat.icon className="size-4 shrink-0 text-primary" />
              </CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-none ring-0">
        <CardHeader>
          <CardTitle>Partners</CardTitle>
          <CardDescription>Open obligations by partner this season</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y border-t">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {sponsor.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sponsor.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{sponsor.tier}</p>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  {sponsor.delivered} delivered
                </div>
                {sponsor.openObligations > 0 ? (
                  <Badge variant="secondary" className="tabular-nums">
                    {sponsor.openObligations} open
                  </Badge>
                ) : (
                  <Badge variant="outline">Up to date</Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
