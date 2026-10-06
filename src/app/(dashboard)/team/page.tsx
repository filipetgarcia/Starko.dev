import type { Metadata } from "next"
import { Users } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Team" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Team"
      description="People in this workspace and their roles."
      icon={Users}
    />
  )
}
