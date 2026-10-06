import type { Metadata } from "next"
import { Package } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Matchday packs" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Matchday packs"
      description="League matchday packs, generated from fixtures and assets."
      icon={Package}
    />
  )
}
