"use client"

import { useActionState } from "react"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendMagicLink, type LoginState } from "./actions"

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    error: initialError,
  })

  if (state.sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-8 text-primary" />
        <p className="text-sm font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a login link to <span className="text-foreground">{state.sentTo}</span>. Open it
          in this browser.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium">
        Work email
      </label>
      <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@club.com" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Sending…" : "Email me a login link"}
      </Button>
    </form>
  )
}
