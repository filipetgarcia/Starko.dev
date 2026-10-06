import type { Metadata } from "next"
import { CalendarDays } from "lucide-react"

import { PagePlaceholder } from "@/components/page-placeholder"

export const metadata: Metadata = { title: "Fixtures" }

export default function Page() {
  return (
    <PagePlaceholder
      title="Fixtures"
      description="Upcoming and past matches, with the partner activations tied to each."
      icon={CalendarDays}
    />
  )
}
