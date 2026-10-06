"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleAlert, Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { confirmUpload, prepareUpload } from "./actions"

type State =
  | { kind: "idle" }
  | { kind: "busy"; step: string }
  | { kind: "done"; status: "passed" | "failed"; notes: string[] }
  | { kind: "error"; message: string }

// Reads width and height from an image or video in the browser, so the spec check can use them.
async function measure(file: File): Promise<{ width?: number; height?: number }> {
  try {
    if (file.type.startsWith("image/")) {
      const bitmap = await createImageBitmap(file)
      const size = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return size
    }
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file)
      try {
        return await new Promise((resolve) => {
          const video = document.createElement("video")
          video.preload = "metadata"
          video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight })
          video.onerror = () => resolve({})
          video.src = url
        })
      } finally {
        URL.revokeObjectURL(url)
      }
    }
  } catch {
    // Unreadable file: the server-side check will flag missing dimensions
  }
  return {}
}

export function UploadItemForm({ token, obligationId, accept }: { token: string; obligationId: string; accept: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [state, setState] = useState<State>({ kind: "idle" })

  async function upload() {
    if (!file) return
    setState({ kind: "busy", step: "Checking file…" })

    const prepared = await prepareUpload(token, obligationId, { name: file.name, type: file.type, size: file.size })
    if (!prepared.ok) return setState({ kind: "error", message: prepared.error })

    setState({ kind: "busy", step: "Uploading…" })
    const [dimensions, uploaded] = await Promise.all([
      measure(file),
      createClient().storage.from("assets").uploadToSignedUrl(prepared.path, prepared.uploadToken, file, {
        contentType: file.type,
      }),
    ])
    if (uploaded.error) return setState({ kind: "error", message: "Upload failed. Please try again." })

    setState({ kind: "busy", step: "Checking against spec…" })
    const result = await confirmUpload(token, obligationId, {
      path: prepared.path,
      fileName: file.name,
      width: dimensions.width,
      height: dimensions.height,
      note,
    })
    if (!result.ok) return setState({ kind: "error", message: result.error })

    setState({ kind: "done", status: result.status, notes: result.notes })
    setFile(null)
    setNote("")
    if (inputRef.current) inputRef.current.value = ""
    router.refresh()
  }

  const busy = state.kind === "busy"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setState({ kind: "idle" })
          }}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
        />
      </div>
      {file && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
          rows={2}
          placeholder="Optional note, e.g. use this version from 1 November"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={upload} disabled={!file || busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload />}
          {busy ? state.step : "Upload"}
        </Button>
        {state.kind === "error" && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <CircleAlert className="size-4" />
            {state.message}
          </p>
        )}
        {state.kind === "done" && state.status === "passed" && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            Received and meets the spec. Thank you.
          </p>
        )}
      </div>
      {state.kind === "done" && state.status === "failed" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">Received, but it doesn&apos;t meet the spec:</p>
          <ul className="mt-1 list-disc pl-5">
            {state.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-1">Please upload a corrected version.</p>
        </div>
      )}
    </div>
  )
}
