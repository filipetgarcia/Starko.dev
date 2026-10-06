"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { getWorkspace } from "@/lib/workspace"

export async function createUploadLink(formData: FormData) {
  const partnerId = String(formData.get("partnerId") ?? "")
  if (!partnerId) return

  const workspace = await getWorkspace()
  const orgId = workspace.organisation?.id
  if (!orgId) return

  const supabase = createAdminClient()
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("id", partnerId)
    .eq("organisation_id", orgId)
    .maybeSingle()
  if (!partner) return

  // One live link per partner: switch off any older ones
  await supabase
    .from("upload_links")
    .update({ status: "revoked" })
    .eq("organisation_id", orgId)
    .eq("partner_id", partnerId)
    .eq("status", "awaiting")

  await supabase.from("upload_links").insert({ organisation_id: orgId, partner_id: partnerId })

  revalidatePath("/upload-links")
  revalidatePath("/overview")
}

export async function revokeUploadLink(formData: FormData) {
  const linkId = String(formData.get("linkId") ?? "")
  const workspace = await getWorkspace()
  const orgId = workspace.organisation?.id
  if (!linkId || !orgId) return

  await createAdminClient()
    .from("upload_links")
    .update({ status: "revoked" })
    .eq("id", linkId)
    .eq("organisation_id", orgId)

  revalidatePath("/upload-links")
  revalidatePath("/overview")
}
