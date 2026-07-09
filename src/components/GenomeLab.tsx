import { useCallback, useEffect, useRef, useState } from "react"
import { supabase, GENOME_LAB_BUCKET } from "../lib/supabaseClient"

interface PdfEntry {
  name: string
  url: string
}

export default function GenomeLab() {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPdfs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: listError } = await supabase.storage
      .from(GENOME_LAB_BUCKET)
      .list("", { limit: 300, sortBy: { column: "name", order: "asc" } })

    if (listError) {
      setError(listError.message)
      setLoading(false)
      return
    }

    const entries = (data ?? [])
      .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
      .map((f) => {
        const { data: urlData } = supabase.storage
          .from(GENOME_LAB_BUCKET)
          .getPublicUrl(f.name)
        return { name: f.name, url: urlData.publicUrl }
      })

    setPdfs(entries)
    setLoading(false)
  }, [])

  useEffect(() => { loadPdfs() }, [loadPdfs])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) continue
      await supabase.storage
        .from(GENOME_LAB_BUCKET)
        .upload(file.name, file, { upsert: true })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    await loadPdfs()
  }

  const viewing = viewingIndex !== null ? pdfs[viewingIndex] : null

  if (viewing !== null && viewing) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewingIndex(null)}
            className="text-sm text-[var(--cream-dim)] hover:text-[var(--cream)]"
          >
            ← Back to shelf
          </button>
          <p className="flex-1 truncate text-sm font-medium">
            {viewing.name.replace(/\.pdf$/i, "").replace(/_/g, " ")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewingIndex((i) => Math.max(0, (i ?? 0) - 1))}
              disabled={viewingIndex === 0}
              className="h-8 rounded-md border border-[var(--cream-dim)]/25 px-3 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]"
            >
              ← Prev
            </button>
            <span className="text-xs text-[var(--cream-dim)]">
              {(viewingIndex ?? 0) + 1} / {pdfs.length}
            </span>
            <button
              type="button"
              onClick={() => setViewingIndex((i) => Math.min(pdfs.length - 1, (i ?? 0) + 1))}
              disabled={viewingIndex === pdfs.length - 1}
              className="h-8 rounded-md border border-[var(--cream-dim)]/25 px-3 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]"
            >
              Next →
            </button>
          </div>
        </div>
        <iframe
          src={viewing.url}
          title={viewing.name}
          className="flex-1 rounded-lg border border-[var(--cream-dim)]/15"
          style={{ background: "#fff" }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">Genome Lab</h2>
          <p className="text-sm text-[var(--cream-dim)]">
            Your cocktail genome lab PDFs — click any book to read it.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-9 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload PDFs"}
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-[var(--cream-dim)]">Loading shelf…</p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          Couldn't load PDFs: {error}. Make sure the <code>genome-lab</code> bucket exists in
          Supabase Storage and is set to public.
        </p>
      )}

      {!loading && !error && pdfs.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--cream-dim)]/25 p-10 text-center">
          <p className="mb-2 text-sm text-[var(--cream-dim)]">No PDFs yet.</p>
          <p className="text-xs text-[var(--cream-dim)]">
            Upload your cocktail genome lab PDFs using the button above.
          </p>
        </div>
      )}

      {!loading && pdfs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pdfs.map((pdf, i) => {
            const title = pdf.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ")
            return (
              <button
                key={pdf.name}
                type="button"
                onClick={() => setViewingIndex(i)}
                className="group flex flex-col items-center gap-2 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4 text-left hover:border-[var(--gold)]/50 hover:bg-[var(--surface-raised)] transition-colors"
              >
                {/* Book spine graphic */}
                <div
                  className="flex w-full items-center justify-center rounded-md"
                  style={{
                    height: 140,
                    background: `hsl(${(i * 47) % 360}, 35%, 22%)`,
                    borderLeft: "6px solid rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    className="select-none text-3xl opacity-60 group-hover:opacity-90 transition-opacity"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    📄
                  </span>
                </div>
                <p className="w-full truncate text-center text-xs font-medium leading-snug">
                  {title}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
