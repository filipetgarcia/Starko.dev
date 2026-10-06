// Hard-coded fictional data. Replace with Supabase queries once the database is connected.

export const currentUser = {
  name: "Sam Okafor",
  email: "sam@riversidefc.example",
  initials: "SO",
}

export const workspaces = [
  { id: "riverside-fc", name: "Riverside FC", plan: "Club" },
  { id: "riverside-women", name: "Riverside FC Women", plan: "Club" },
]

export const currentWorkspace = workspaces[0]

export const sponsors = [
  { id: "harbour-bank", name: "Harbour Bank", tier: "Principal partner", openObligations: 5, delivered: 18 },
  { id: "northline-energy", name: "Northline Energy", tier: "Kit partner", openObligations: 3, delivered: 12 },
  { id: "brightwater", name: "Brightwater Mineral Water", tier: "Official partner", openObligations: 2, delivered: 7 },
  { id: "kestrel-motors", name: "Kestrel Motors", tier: "Official partner", openObligations: 2, delivered: 6 },
  { id: "oakmill-bakery", name: "Oakmill Bakery", tier: "Community partner", openObligations: 0, delivered: 3 },
]

export const overviewStats = {
  obligationsDueThisWeek: { value: 12, detail: "Across 4 partners · 3 due before Saturday" },
  assetsMissing: { value: 7, detail: "Mostly LED boards for vs Eastport Albion" },
  uploadLinksAwaiting: { value: 3, detail: "Brightwater, Kestrel Motors, Oakmill Bakery" },
  proofCollected: { value: 46, detail: "of 58 this season · 79% complete" },
}
