import type { Metadata } from "next"
import { ListChecks } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Obligations" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Obligations"
      description="Everything you have promised partners, and when it is due."
      icon={ListChecks}
    />
  )
}
