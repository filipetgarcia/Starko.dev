import { createClient } from "@supabase/supabase-js"

// Server-only Supabase client using the service role key. It bypasses row-level security,
// so it must never be imported into a Client Component or exposed to the browser.
// MVP note: there is no login yet, so the app reads the demo club's data with this client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.")
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
