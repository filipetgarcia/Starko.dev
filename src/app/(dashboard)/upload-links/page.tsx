import type { Metadata } from "next"
import { Link2 } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Upload links" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Upload links"
      description="Links you send to partners so they can upload assets."
      icon={Link2}
    />
  )
}
