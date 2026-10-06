import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { CopyLinkButton } from "@/components/copy-link-button"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createAdminClient } from "@/lib/supabase/admin"
import { getWorkspace } from "@/lib/workspace"
import { createUploadLink, revokeUploadLink } from "./actions"

export const metadata: Metadata = { title: "Upload links" }

type LinkRow = {
  id: string
  token: string
  status: "awaiting" | "completed" | "revoked"
  created_at: string
  expires_at: string
  partner_id: string
  partners: { name: string; tier: string | null } | null
}

const dateFmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })

export default async function UploadLinksPage() {
  const workspace = await getWorkspace()
  const orgId = workspace.organisation!.id
  const supabase = createAdminClient()

  const [linksRes, partnersRes, obligationsRes] = await Promise.all([
    supabase
      .from("upload_links")
      .select("id, token, status, created_at, expires_at, partner_id, partners(name, tier)")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("partners").select("id, name").eq("organisation_id", orgId).order("name"),
    supabase
      .from("obligations")
      .select("partner_id, asset_id")
      .eq("organisation_id", orgId)
      .eq("requires_asset", true)
      .neq("status", "delivered"),
  ])

  const links = (linksRes.data ?? []) as unknown as LinkRow[]
  const partners = partnersRes.data ?? []
  const obligations = obligationsRes.data ?? []
  const now = new Date()

  const progress = (partnerId: string) => {
    const mine = obligations.filter((o) => o.partner_id === partnerId)
    return { received: mine.filter((o) => o.asset_id).length, needed: mine.length }
  }

  const live = links.filter((l) => l.status !== "revoked" && new Date(l.expires_at) > now)
  const old = links.filter((l) => !live.includes(l))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload links</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a partner their link. They upload artwork against each item, and every file is checked against the spec.
        </p>
      </div>

      <Card className="border shadow-none ring-0">
        <CardHeader>
          <CardTitle>Create a link</CardTitle>
          <CardDescription>Creating a new link for a partner switches off their previous one.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUploadLink} className="flex flex-col gap-2 sm:flex-row">
            <select
              name="partnerId"
              required
              defaultValue=""
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
            >
              <option value="" disabled>
                Choose a partner
              </option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button type="submit">Create link</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border shadow-none ring-0">
        <CardHeader>
          <CardTitle>Active links</CardTitle>
          <CardDescription>
            {live.length ? `${live.length} link${live.length === 1 ? "" : "s"} live` : "No live links"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y border-t">
            {live.map((link) => {
              const p = progress(link.partner_id)
              return (
                <li key={link.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{link.partners?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {dateFmt(link.created_at)} · expires {dateFmt(link.expires_at)} · {p.received} of {p.needed}{" "}
                      items received
                    </p>
                  </div>
                  {link.status === "completed" ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Awaiting partner</Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <CopyLinkButton path={`/u/${link.token}`} />
                    <Link
                      href={`/u/${link.token}`}
                      target="_blank"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <ExternalLink />
                      Open
                    </Link>
                    <form action={revokeUploadLink}>
                      <input type="hidden" name="linkId" value={link.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                        Switch off
                      </Button>
                    </form>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {old.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Old links</p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {old.map((link) => (
              <li key={link.id}>
                {link.partners?.name} · created {dateFmt(link.created_at)} ·{" "}
                {link.status === "revoked" ? "switched off" : "expired"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
