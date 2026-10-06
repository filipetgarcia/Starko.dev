import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type Workspace = {
  userId: string
  email: string
  displayName: string
  initials: string
  organisation: { id: string; name: string; slug: string } | null
}

// The logged-in user and the club workspace they belong to. Cached per request.
export const getWorkspace = cache(async (): Promise<Workspace> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("memberships")
    .select("display_name, organisations(id, name, slug)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle()

  const email = user.email ?? ""
  const displayName = (membership?.display_name as string | null) ?? email.split("@")[0]
  const organisation = (membership?.organisations ?? null) as Workspace["organisation"]

  return {
    userId: user.id,
    email,
    displayName,
    initials: displayName
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    organisation,
  }
})
