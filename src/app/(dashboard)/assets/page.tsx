import type { Metadata } from "next"
import { FolderOpen } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Assets" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Assets"
      description="Logos, artwork and creative files for each activation."
      icon={FolderOpen}
    />
  )
}
