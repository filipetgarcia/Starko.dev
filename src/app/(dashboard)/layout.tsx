import { Suspense } from "react"

import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { AppSidebar } from "@/components/app-sidebar"
import { NoWorkspace } from "@/components/no-workspace"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { getWorkspace } from "@/lib/workspace"

// Reading the login cookie is per-request, so the shell streams in behind a loading state.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  )
}

function DashboardLoading() {
  return (
    <div className="flex min-h-svh">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar md:block" />
      <div className="flex-1 p-8">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-7 w-56 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace()

  if (!workspace.organisation) return <NoWorkspace email={workspace.email} />

  return (
    <SidebarProvider>
      <AppSidebar
        workspaceName={workspace.organisation.name}
        userName={workspace.displayName}
        userEmail={workspace.email}
        initials={workspace.initials}
      />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <Separator orientation="vertical" className="mr-1 h-4! self-center" />
          <AppBreadcrumbs workspaceName={workspace.organisation.name} />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
