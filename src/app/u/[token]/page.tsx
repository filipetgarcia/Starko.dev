import type { Metadata } from "next"
import { Suspense } from "react"
import { CheckCircle2, CircleAlert, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { specFor } from "@/lib/specs"
import { getLinkContext, getUploadItems, type UploadItem } from "@/lib/upload-links"
import { UploadItemForm } from "./upload-item"

export const metadata: Metadata = { title: "Upload artwork", robots: { index: false, follow: false } }

export default function UploadPage({ params }: PageProps<"/u/[token]">) {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
          <UploadContent params={params} />
        </Suspense>
        <p className="text-center text-xs text-muted-foreground">Powered by Strako</p>
      </div>
    </div>
  )
}

const dateFmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" })

async function UploadContent({ params }: { params: PageProps<"/u/[token]">["params"] }) {
  const { token } = await params
  const result = await getLinkContext(token)

  if (!result.ok) {
    const message = {
      not_found: "This upload link doesn't exist. Check you copied the whole link.",
      expired: "This upload link has expired. Ask the club to send you a new one.",
      revoked: "This upload link has been switched off. Ask the club to send you a new one.",
    }[result.reason]
    return (
      <Card className="border shadow-none ring-0">
        <CardHeader>
          <CardTitle>Link not available</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { ctx } = result
  const items = await getUploadItems(ctx)
  const outstanding = items.filter((i) => !i.current)

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground">
          {ctx.organisation.name} × {ctx.partner.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Upload your artwork</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {outstanding.length
            ? `${outstanding.length} item${outstanding.length === 1 ? "" : "s"} still needed. Each file is checked against the spec as soon as it arrives.`
            : "Everything we need is in. Thank you. You can still upload a newer version below."}{" "}
          Link valid until {dateFmt(ctx.link.expires_at)}.
        </p>
      </div>

      {items.length === 0 && (
        <Card className="border shadow-none ring-0">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nothing to upload right now.
          </CardContent>
        </Card>
      )}

      {items.map((item) => (
        <ItemCard key={item.id} token={token} item={item} />
      ))}
    </>
  )
}

function ItemCard({ token, item }: { token: string; item: UploadItem }) {
  const spec = specFor(item.placement)
  return (
    <Card className="border shadow-none ring-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <CardDescription className="mt-1">
              {item.fixture ? `vs ${item.fixture.opponent} · ` : ""}Due {dateFmt(item.due_date)}
            </CardDescription>
          </div>
          {item.current ? (
            <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 /> Received
            </Badge>
          ) : item.lastFailed ? (
            <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-900">
              <CircleAlert /> Needs fixing
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock /> Needed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{spec.label}:</span> {spec.description} · max 50 MB
        </p>
        {item.current && (
          <p className="text-sm text-muted-foreground">
            Current file: <span className="text-foreground">{item.current.file_name}</span> (v{item.current.version})
          </p>
        )}
        {!item.current && item.lastFailed && (
          <p className="text-sm text-amber-900">
            {item.lastFailed.file_name} didn&apos;t meet the spec. {item.lastFailed.spec_notes}
          </p>
        )}
        <UploadItemForm token={token} obligationId={item.id} accept={spec.accepts.join(",")} />
      </CardContent>
    </Card>
  )
}
