import { cache } from "react"
import { connection } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

export type Workspace = {
  displayName: string
  email: string
  initials: string
  organisation: { id: string; name: string; slug: string } | null
}

// MVP: no login. Everyone sees the demo club, picked by slug (default: Riverside FC).
const DEMO_SLUG = process.env.DEMO_ORG_SLUG ?? "riverside-fc"
const DEMO_USER = { displayName: "Sam Okafor", email: "sam@riversidefc.example", initials: "SO" }

export const getWorkspace = cache(async (): Promise<Workspace> => {
  await connection() // always read fresh data at request time

  const supabase = createAdminClient()
  const { data: organisation, error } = await supabase
    .from("organisations")
    .select("id, name, slug")
    .eq("slug", DEMO_SLUG)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return { ...DEMO_USER, organisation }
})
