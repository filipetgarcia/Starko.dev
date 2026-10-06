// Artwork requirements per placement, used to check partner uploads automatically.
// These are demo specs; a real club would set its own per board, screen and channel.

export type Placement = "led" | "in_bowl" | "concourse" | "social" | "hospitality" | "print" | "other"

type Spec = {
  label: string
  description: string
  accepts: string[]
  minWidth?: number
  minHeight?: number
}

const IMAGE = ["image/png", "image/jpeg", "image/webp"]
const VIDEO = ["video/mp4", "video/quicktime"]
const PDF = ["application/pdf"]

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const ALL_ACCEPTED = [...IMAGE, ...VIDEO, ...PDF]

export const PLACEMENT_SPECS: Record<Placement, Spec> = {
  led: {
    label: "LED boards",
    description: "PNG, JPG or MP4 · at least 1920 px wide",
    accepts: [...IMAGE, ...VIDEO],
    minWidth: 1920,
  },
  in_bowl: {
    label: "In-bowl screen",
    description: "MP4 or image · at least 1920 × 1080",
    accepts: [...IMAGE, ...VIDEO],
    minWidth: 1920,
    minHeight: 1080,
  },
  concourse: {
    label: "Concourse screens",
    description: "MP4 or image · at least 1920 × 1080",
    accepts: [...IMAGE, ...VIDEO],
    minWidth: 1920,
    minHeight: 1080,
  },
  social: {
    label: "Social",
    description: "PNG, JPG or MP4 · at least 1080 × 1080",
    accepts: [...IMAGE, ...VIDEO],
    minWidth: 1080,
    minHeight: 1080,
  },
  hospitality: {
    label: "Hospitality",
    description: "Print-ready PDF, or a high-resolution image",
    accepts: [...PDF, ...IMAGE],
  },
  print: {
    label: "Print",
    description: "Print-ready PDF",
    accepts: PDF,
  },
  other: {
    label: "Other",
    description: "Image, video or PDF",
    accepts: ALL_ACCEPTED,
  },
}

export function specFor(placement: string | null | undefined): Spec {
  return PLACEMENT_SPECS[(placement ?? "other") as Placement] ?? PLACEMENT_SPECS.other
}

export type SpecResult = { status: "passed" | "failed"; notes: string[] }

// Checks one uploaded file against its placement's spec.
export function checkSpec(
  placement: string | null | undefined,
  file: { mimeType: string; sizeBytes: number; width?: number | null; height?: number | null }
): SpecResult {
  const spec = specFor(placement)
  const notes: string[] = []

  if (!spec.accepts.includes(file.mimeType)) {
    notes.push(`${friendlyType(file.mimeType)} isn't accepted here. Expected: ${spec.description}.`)
  }
  if (file.sizeBytes > MAX_UPLOAD_BYTES) {
    notes.push(`File is ${formatBytes(file.sizeBytes)}; the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`)
  }
  const isVisual = file.mimeType.startsWith("image/") || file.mimeType.startsWith("video/")
  if (isVisual && (spec.minWidth || spec.minHeight)) {
    if (!file.width || !file.height) {
      notes.push("Couldn't read the dimensions of this file.")
    } else {
      if (spec.minWidth && file.width < spec.minWidth) {
        notes.push(`Width is ${file.width} px; needs at least ${spec.minWidth} px.`)
      }
      if (spec.minHeight && file.height < spec.minHeight) {
        notes.push(`Height is ${file.height} px; needs at least ${spec.minHeight} px.`)
      }
    }
  }

  return { status: notes.length ? "failed" : "passed", notes }
}

export function friendlyType(mime: string | null | undefined) {
  const map: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/webp": "WebP",
    "video/mp4": "MP4",
    "video/quicktime": "MOV",
    "application/pdf": "PDF",
  }
  return mime ? (map[mime] ?? mime) : "Unknown type"
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—"
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
