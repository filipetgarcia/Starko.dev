import type { Metadata } from "next"
import { CheckCircle2, CircleAlert, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes, friendlyType, specFor } from "@/lib/specs"
import { createAdminClient } from "@/lib/supabase/admin"
import { getWorkspace } from "@/lib/workspace"

export const metadata: Metadata = { title: "Assets" }

type AssetRow = {
  id: string
  file_name: string
  file_path: string | null
  version: number
  spec_status: "pending" | "passed" | "failed"
  spec_notes: string | null
  partner_note: string | null
  mime_type: string | null
  size_bytes: number | null
  width: number | null
  height: number | null
  created_at: string
  partners: { name: string } | null
  obligations: { title: string; placement: string | null } | null
}

const dateFmt = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  })

export default async function AssetsPage() {
  const workspace = await getWorkspace()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("assets")
    .select(
      "id, file_name, file_path, version, spec_status, spec_notes, partner_note, mime_type, size_bytes, width, height, created_at, partners(name), obligations!assets_obligation_id_fkey(title, placement)"
    )
    .eq("organisation_id", workspace.organisation!.id)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)

  const assets = (data ?? []) as unknown as AssetRow[]

  // Short-lived private links so the club can open each uploaded file
  const paths = assets.map((a) => a.file_path).filter((p): p is string => Boolean(p))
  const { data: signed } = paths.length
    ? await supabase.storage.from("assets").createSignedUrls(paths, 60 * 60)
    : { data: [] }
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))

  const counts = {
    passed: assets.filter((a) => a.spec_status === "passed").length,
    failed: assets.filter((a) => a.spec_status === "failed").length,
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Artwork received from partners, newest first. {counts.passed} meet the spec · {counts.failed} need fixing.
        </p>
      </div>

      <Card className="border shadow-none ring-0">
        <CardHeader>
          <CardTitle>All assets</CardTitle>
          <CardDescription>{assets.length} files</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y border-t">
            {assets.map((a) => {
              const url = a.file_path ? urlFor.get(a.file_path) : undefined
              const isImage = a.mime_type?.startsWith("image/")
              return (
                <li key={a.id} className="flex gap-4 px-4 py-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-[10px] font-medium text-muted-foreground">
                    {url && isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="size-full object-cover" />
                    ) : (
                      friendlyType(a.mime_type).slice(0, 4)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:underline">
                          {a.file_name}
                        </a>
                      ) : (
                        <span className="truncate text-sm font-medium">{a.file_name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">v{a.version}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.partners?.name ?? "Unknown partner"}
                      {a.obligations ? ` · ${a.obligations.title} (${specFor(a.obligations.placement).label})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.file_path
                        ? `${friendlyType(a.mime_type)} · ${formatBytes(a.size_bytes)}${a.width && a.height ? ` · ${a.width} × ${a.height}` : ""} · received ${dateFmt(a.created_at)}`
                        : "Demo record (no file)"}
                    </p>
                    {a.partner_note && <p className="mt-1 text-xs">Partner note: {a.partner_note}</p>}
                    {a.spec_status === "failed" && a.spec_notes && (
                      <p className="mt-1 text-xs text-amber-900">{a.spec_notes}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {a.spec_status === "passed" ? (
                      <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800">
                        <CheckCircle2 /> Meets spec
                      </Badge>
                    ) : a.spec_status === "failed" ? (
                      <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-900">
                        <CircleAlert /> Needs fixing
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock /> Not checked
                      </Badge>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
