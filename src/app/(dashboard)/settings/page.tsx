import type { Metadata } from "next"
import { Settings } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Workspace preferences and integrations."
      icon={Settings}
    />
  )
}
