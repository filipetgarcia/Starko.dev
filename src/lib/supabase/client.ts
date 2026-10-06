import { createBrowserClient } from "@supabase/ssr"

// Supabase client for Client Components. Not used yet — the database isn't connected.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
