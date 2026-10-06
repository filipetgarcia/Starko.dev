"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export async function signOut(router: ReturnType<typeof useRouter>) {
  await createClient().auth.signOut()
  router.replace("/login")
  router.refresh()
}

export function SignOutButton() {
  const router = useRouter()
  return (
    <Button variant="outline" onClick={() => signOut(router)}>
      Log out
    </Button>
  )
}
