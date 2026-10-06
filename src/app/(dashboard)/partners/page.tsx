import type { Metadata } from "next"
import { Handshake } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Partners" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Partners"
      description="Your sponsors, their contracts and contacts."
      icon={Handshake}
    />
  )
}
