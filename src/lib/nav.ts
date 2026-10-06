import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  Link2,
  ListChecks,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; href: string; icon: LucideIcon }
export type NavGroup = { label: string; items: NavItem[] }

export const navGroups: NavGroup[] = [
  {
    label: "General",
    items: [
      { title: "Overview", href: "/overview", icon: LayoutDashboard },
      { title: "Fixtures", href: "/fixtures", icon: CalendarDays },
      { title: "Obligations", href: "/obligations", icon: ListChecks },
      { title: "Partners", href: "/partners", icon: Handshake },
    ],
  },
  {
    label: "Delivery",
    items: [
      { title: "Assets", href: "/assets", icon: FolderOpen },
      { title: "Upload links", href: "/upload-links", icon: Link2 },
      { title: "Proof", href: "/proof", icon: FileCheck2 },
    ],
  },
  {
    label: "League",
    items: [
      { title: "Matchday packs", href: "/matchday-packs", icon: Package },
      { title: "Compliance", href: "/compliance", icon: ClipboardCheck },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Team", href: "/team", icon: Users },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export const allNavItems = navGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label }))
)

export const workspaceIcon = Building2
