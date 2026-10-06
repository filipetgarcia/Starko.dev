"use server"

import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"

export type LoginState = { error?: string; sentTo?: string }

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." }

  const h = await headers()
  const origin = h.get("origin") ?? `https://${h.get("host")}`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) return { error: error.message }
  return { sentTo: email }
}
