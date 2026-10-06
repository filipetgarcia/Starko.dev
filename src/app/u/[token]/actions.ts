"use server"

import { revalidatePath } from "next/cache"

import { checkSpec, MAX_UPLOAD_BYTES, specFor } from "@/lib/specs"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLinkContext } from "@/lib/upload-links"

const BUCKET = "assets"

type Prepared = { ok: true; path: string; uploadToken: string } | { ok: false; error: string }

async function loadObligation(token: string, obligationId: string) {
  const link = await getLinkContext(token)
  if (!link.ok) return { error: "This upload link is no longer active. Ask the club for a new one." } as const

  const supabase = createAdminClient()
  const { data: obligation } = await supabase
    .from("obligations")
    .select("id, placement, organisation_id, partner_id, status")
    .eq("id", obligationId)
    .maybeSingle()

  if (
    !obligation ||
    obligation.organisation_id !== link.ctx.organisation.id ||
    obligation.partner_id !== link.ctx.partner.id
  ) {
    return { error: "That item isn't part of this upload link." } as const
  }
  return { ctx: link.ctx, obligation, supabase } as const
}

// Step 1: check the file looks acceptable, then hand back a one-time signed upload URL,
// so the file goes straight from the partner's browser to storage.
export async function prepareUpload(
  token: string,
  obligationId: string,
  file: { name: string; type: string; size: number }
): Promise<Prepared> {
  const loaded = await loadObligation(token, obligationId)
  if ("error" in loaded) return { ok: false, error: loaded.error! }
  const { ctx, obligation, supabase } = loaded

  const spec = specFor(obligation.placement)
  if (!spec.accepts.includes(file.type)) {
    return { ok: false, error: `That file type isn't accepted here. Expected: ${spec.description}.` }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "That file is over 50 MB. Please send a compressed version." }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100) || "upload"
  const path = `${ctx.organisation.id}/${ctx.partner.id}/${obligation.id}/${Date.now()}-${safeName}`

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { ok: false, error: "Couldn't start the upload. Please try again." }

  return { ok: true, path, uploadToken: data.token }
}

type Confirmed =
  | { ok: true; status: "passed" | "failed"; notes: string[]; allDone: boolean }
  | { ok: false; error: string }

// Step 2: after the file has landed in storage, record it, run the spec check,
// and mark the obligation as having its asset if it passed.
export async function confirmUpload(
  token: string,
  obligationId: string,
  input: { path: string; fileName: string; width?: number | null; height?: number | null; note?: string }
): Promise<Confirmed> {
  const loaded = await loadObligation(token, obligationId)
  if ("error" in loaded) return { ok: false, error: loaded.error! }
  const { ctx, obligation, supabase } = loaded

  const folder = `${ctx.organisation.id}/${ctx.partner.id}/${obligation.id}`
  if (!input.path.startsWith(`${folder}/`)) return { ok: false, error: "Upload didn't match this item." }

  // Read the real size and type from storage rather than trusting the browser
  const objectName = input.path.slice(folder.length + 1)
  const { data: listed } = await supabase.storage.from(BUCKET).list(folder, { search: objectName, limit: 1 })
  const stored = listed?.find((o) => o.name === objectName)
  if (!stored) return { ok: false, error: "The file didn't arrive. Please try uploading again." }

  const mimeType: string = stored.metadata?.mimetype ?? "application/octet-stream"
  const sizeBytes: number = stored.metadata?.size ?? 0
  const width = input.width ? Math.round(input.width) : null
  const height = input.height ? Math.round(input.height) : null
  const result = checkSpec(obligation.placement, { mimeType, sizeBytes, width, height })

  const { count } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("obligation_id", obligation.id)

  const { data: asset, error } = await supabase
    .from("assets")
    .insert({
      organisation_id: ctx.organisation.id,
      partner_id: ctx.partner.id,
      obligation_id: obligation.id,
      upload_link_id: ctx.link.id,
      file_path: input.path,
      file_name: input.fileName.slice(0, 200),
      version: (count ?? 0) + 1,
      valid_from: new Date().toISOString().slice(0, 10),
      mime_type: mimeType,
      size_bytes: sizeBytes,
      width,
      height,
      partner_note: input.note?.trim().slice(0, 1000) || null,
      spec_status: result.status,
      spec_notes: result.notes.join(" ") || null,
    })
    .select("id")
    .single()
  if (error || !asset) return { ok: false, error: "Couldn't save the upload. Please try again." }

  if (result.status === "passed") {
    await supabase.from("obligations").update({ asset_id: asset.id }).eq("id", obligation.id)
  }

  // Close the link once nothing is missing for this partner
  const { count: stillMissing } = await supabase
    .from("obligations")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", ctx.organisation.id)
    .eq("partner_id", ctx.partner.id)
    .eq("requires_asset", true)
    .neq("status", "delivered")
    .is("asset_id", null)
  const allDone = (stillMissing ?? 0) === 0
  if (allDone) await supabase.from("upload_links").update({ status: "completed" }).eq("id", ctx.link.id)

  revalidatePath(`/u/${token}`)
  revalidatePath("/overview")
  revalidatePath("/upload-links")
  revalidatePath("/assets")

  return { ok: true, status: result.status, notes: result.notes, allDone }
}
