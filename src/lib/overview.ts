import { createClient } from "@/lib/supabase/server"

const PLACEMENT_LABELS: Record<string, string> = {
  led: "LED boards",
  in_bowl: "in-bowl screen",
  concourse: "concourse screens",
  social: "social posts",
  hospitality: "hospitality",
  print: "print",
  other: "other items",
}

type ObligationRow = {
  id: string
  partner_id: string | null
  fixture_id: string | null
  status: "open" | "in_progress" | "delivered"
  due_date: string
  requires_asset: boolean
  asset_id: string | null
  placement: string | null
  proof: { count: number }[]
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

// Everything the Overview page shows, computed from the club's own rows (RLS scopes the queries).
export async function getOverview(organisationId: string) {
  const supabase = await createClient()
  const now = new Date()

  const [obligationsRes, partnersRes, linksRes, nextFixtureRes] = await Promise.all([
    supabase
      .from("obligations")
      .select("id, partner_id, fixture_id, status, due_date, requires_asset, asset_id, placement, proof(count)")
      .eq("organisation_id", organisationId),
    supabase.from("partners").select("id, name, tier").eq("organisation_id", organisationId).order("created_at"),
    supabase
      .from("upload_links")
      .select("id, partners(name)")
      .eq("organisation_id", organisationId)
      .eq("status", "awaiting")
      .gt("expires_at", now.toISOString())
      .order("created_at"),
    supabase
      .from("fixtures")
      .select("id, opponent, kickoff")
      .eq("organisation_id", organisationId)
      .gte("kickoff", now.toISOString())
      .order("kickoff")
      .limit(1)
      .maybeSingle(),
  ])

  const error = obligationsRes.error ?? partnersRes.error ?? linksRes.error ?? nextFixtureRes.error
  if (error) throw new Error(error.message)

  const obligations = (obligationsRes.data ?? []) as unknown as ObligationRow[]
  const partners = partnersRes.data ?? []
  const links = (linksRes.data ?? []) as unknown as { id: string; partners: { name: string } | null }[]
  const nextFixture = nextFixtureRes.data as { id: string; opponent: string; kickoff: string } | null

  const today = isoDate(now)
  const weekEnd = isoDate(new Date(now.getTime() + 6 * 86_400_000))
  const open = obligations.filter((o) => o.status !== "delivered")

  // 1. Obligations due this week
  const dueThisWeek = open.filter((o) => o.due_date >= today && o.due_date <= weekEnd)
  const dueThisWeekPartners = new Set(dueThisWeek.map((o) => o.partner_id).filter(Boolean)).size
  const matchDay = nextFixture ? nextFixture.kickoff.slice(0, 10) : null
  const matchDayName = nextFixture
    ? new Date(nextFixture.kickoff).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/London" })
    : null
  const dueBeforeMatch = matchDay ? dueThisWeek.filter((o) => o.due_date < matchDay).length : 0

  // 2. Assets missing
  const missing = open.filter((o) => o.requires_asset && !o.asset_id)
  const placementCounts = new Map<string, number>()
  missing.forEach((o) => placementCounts.set(o.placement ?? "other", (placementCounts.get(o.placement ?? "other") ?? 0) + 1))
  const topPlacement = [...placementCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const missingForNext = nextFixture ? missing.filter((o) => o.fixture_id === nextFixture.id).length : 0

  // 4. Proof collected
  const withProof = obligations.filter((o) => (o.proof?.[0]?.count ?? 0) > 0).length
  const proofPct = obligations.length ? Math.round((withProof / obligations.length) * 100) : 0

  const partnerRows = partners
    .map((p) => {
    const mine = obligations.filter((o) => o.partner_id === p.id)
    return {
      id: p.id as string,
      name: p.name as string,
      tier: (p.tier as string | null) ?? "",
      delivered: mine.filter((o) => o.status === "delivered").length,
      open: mine.filter((o) => o.status !== "delivered").length,
    }
    })
    .sort((a, b) => b.delivered + b.open - (a.delivered + a.open) || a.name.localeCompare(b.name))

  return {
    nextFixture,
    stats: {
      obligationsDueThisWeek: {
        value: dueThisWeek.length,
        detail: dueThisWeek.length
          ? `Across ${dueThisWeekPartners} partner${dueThisWeekPartners === 1 ? "" : "s"}` +
            (matchDayName ? ` · ${dueBeforeMatch} due before ${matchDayName}` : "")
          : "Nothing due in the next 7 days",
      },
      assetsMissing: {
        value: missing.length,
        detail: missing.length
          ? `Mostly ${PLACEMENT_LABELS[topPlacement ?? "other"]}` +
            (nextFixture && missingForNext ? ` for vs ${nextFixture.opponent}` : "")
          : "Every asset is in",
      },
      uploadLinksAwaiting: {
        value: links.length,
        detail: links.length ? links.map((l) => l.partners?.name.split(" ")[0]).filter(Boolean).join(", ") : "No links waiting",
      },
      proofCollected: {
        value: withProof,
        detail: `of ${obligations.length} this season · ${proofPct}% complete`,
      },
    },
    partners: partnerRows,
  }
}
