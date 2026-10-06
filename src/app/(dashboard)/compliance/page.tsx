import type { Metadata } from "next"
import { ClipboardCheck } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Compliance" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Compliance"
      description="League rules on sponsorship and branding."
      icon={ClipboardCheck}
    />
  )
}
