import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignOutButton } from "@/components/sign-out-button"

export function NoWorkspace({ email }: { email: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm border shadow-none ring-0">
        <CardHeader>
          <CardTitle>No workspace yet</CardTitle>
          <CardDescription>
            {email} isn&apos;t linked to a club. Ask your club admin for an invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  )
}
