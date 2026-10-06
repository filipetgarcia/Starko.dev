"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { allNavItems } from "@/lib/nav"

export function AppBreadcrumbs({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname()
  const page = allNavItems.find((item) => item.href === pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden sm:inline-flex">{workspaceName}</BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:inline-flex" />
        {page && (
          <>
            <BreadcrumbItem>{page.group}</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
