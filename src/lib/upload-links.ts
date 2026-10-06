import { createAdminClient } from "@/lib/supabase/admin"

export type UploadLinkContext = {
  link: { id: string; token: string; status: string; expires_at: string; partner_id: string; organisation_id: string }
  organisation: { id: string; name: string }
  partner: { id: string; name: string }
}

export type UploadItem = {
  id: string
  title: string
  placement: string | null
  due_date: string
  fixture: { opponent: string; kickoff: string } | null
  current: {
    file_name: string
    version: number
    spec_status: "pending" | "passed" | "failed"
    spec_notes: string | null
    created_at: string
  } | null
  lastFailed: { file_name: string; spec_notes: string | null } | null
}

// Looks up an upload link by its secret token. Returns why it can't be used, if it can't.
export async function getLinkContext(
  token: string
): Promise<{ ok: true; ctx: UploadLinkContext } | { ok: false; reason: "not_found" | "expired" | "revoked" }> {
  if (!/^[a-f0-9]{32,128}$/.test(token)) return { ok: false, reason: "not_found" }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("upload_links")
    .select("id, token, status, expires_at, partner_id, organisation_id, partners(id, name), organisations(id, name)")
    .eq("token", token)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return { ok: false, reason: "not_found" }
  if (data.status === "revoked") return { ok: false, reason: "revoked" }
  if (new Date(data.expires_at) < new Date()) return { ok: false, reason: "expired" }

  const { partners, organisations, ...link } = data as typeof data & {
    partners: { id: string; name: string }
    organisations: { id: string; name: string }
  }
  return { ok: true, ctx: { link, partner: partners, organisation: organisations } }
}

// Everything this partner still owes, plus anything already received, newest version first.
export async function getUploadItems(ctx: UploadLinkContext): Promise<UploadItem[]> {
  const supabase = createAdminClient()

  const { data: obligations, error } = await supabase
    .from("obligations")
    .select("id, title, placement, due_date, asset_id, fixtures(opponent, kickoff)")
    .eq("organisation_id", ctx.organisation.id)
    .eq("partner_id", ctx.partner.id)
    .eq("requires_asset", true)
    .neq("status", "delivered")
    .order("due_date")
  if (error) throw new Error(error.message)

  const ids = (obligations ?? []).map((o) => o.id)
  const assetIds = (obligations ?? []).map((o) => o.asset_id).filter(Boolean)
  const filters = [ids.length && `obligation_id.in.(${ids.join(",")})`, assetIds.length && `id.in.(${assetIds.join(",")})`]
    .filter(Boolean)
    .join(",")
  const { data: assets, error: assetsError } = filters
    ? await supabase
        .from("assets")
        .select("id, obligation_id, file_name, version, spec_status, spec_notes, created_at")
        .or(filters)
        .order("created_at", { ascending: false })
    : { data: [], error: null }
  if (assetsError) throw new Error(assetsError.message)

  return (obligations ?? []).map((o) => {
    const mine = (assets ?? []).filter((a) => a.obligation_id === o.id)
    const linked = o.asset_id ? (assets ?? []).find((a) => a.id === o.asset_id) : undefined
    const latest = mine[0]
    return {
      id: o.id,
      title: o.title,
      placement: o.placement,
      due_date: o.due_date,
      fixture: (o.fixtures as unknown as UploadItem["fixture"]) ?? null,
      current: linked ?? null,
      lastFailed: !o.asset_id && latest?.spec_status === "failed" ? latest : null,
    } as UploadItem
  })
}
