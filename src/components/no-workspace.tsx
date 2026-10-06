import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NoWorkspace() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm border shadow-none ring-0">
        <CardHeader>
          <CardTitle>No demo data yet</CardTitle>
          <CardDescription>
            Run supabase/seed.sql in the Supabase SQL Editor to create the Riverside FC demo club.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
