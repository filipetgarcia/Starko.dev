import type { Metadata } from "next"
import { FileCheck2 } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Proof" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Proof"
      description="Photos, screenshots and reports showing obligations were delivered."
      icon={FileCheck2}
    />
  )
}
