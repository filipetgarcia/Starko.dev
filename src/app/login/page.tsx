import type { Metadata } from "next"
import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Log in" }

export default function LoginPage({ searchParams }: PageProps<"/login">) {

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            S
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Strako</span>
        </div>
        <Card className="border shadow-none ring-0">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>We&apos;ll email you a link. No password needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoginForm />}>
              <LoginFormWithError searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function LoginFormWithError({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams
  return <LoginForm initialError={typeof error === "string" ? error : undefined} />
}
