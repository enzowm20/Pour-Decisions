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
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

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

  // Scroll the active card into view when activeIndex changes
  useEffect(() => {
    const card = cardRefs.current[activeIndex]
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeIndex])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) continue
      const { error: uploadErr } = await supabase.storage
        .from(GENOME_LAB_BUCKET)
        .upload(file.name, file, { upsert: true })
      if (uploadErr) {
        setUploadError(`Upload failed: ${uploadErr.message}`)
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    await loadPdfs()
  }

  // Full-screen viewer
  if (viewingIndex !== null && pdfs[viewingIndex]) {
    const pdf = pdfs[viewingIndex]
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewingIndex(null)}
            className="text-sm text-[var(--cream-dim)] hover:text-[var(--cream)]"
          >
            ← Back
          </button>
          <p className="flex-1 truncate text-sm font-medium">
            {pdf.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { const i = Math.max(0, viewingIndex - 1); setViewingIndex(i); setActiveIndex(i) }}
              disabled={viewingIndex === 0}
              className="h-8 rounded-md border border-[var(--cream-dim)]/25 px-3 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]"
            >
              ← Prev
            </button>
            <span className="text-xs text-[var(--cream-dim)]">{viewingIndex + 1} / {pdfs.length}</span>
            <button
              type="button"
              onClick={() => { const i = Math.min(pdfs.length - 1, viewingIndex + 1); setViewingIndex(i); setActiveIndex(i) }}
              disabled={viewingIndex === pdfs.length - 1}
              className="h-8 rounded-md border border-[var(--cream-dim)]/25 px-3 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]"
            >
              Next →
            </button>
          </div>
        </div>
        <iframe
          src={pdf.url}
          title={pdf.name}
          className="flex-1 rounded-lg border border-[var(--cream-dim)]/15"
          style={{ background: "#fff" }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">Genome Lab</h2>
          <p className="text-sm text-[var(--cream-dim)]">
            Flick through your cocktail genome PDFs — click any to open it.
          </p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleUpload} />
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

      {uploadError && <p className="mb-3 text-sm text-red-400">{uploadError}</p>}
      {loading && <p className="text-sm text-[var(--cream-dim)]">Loading shelf…</p>}
      {error && (
        <p className="text-sm text-red-400">
          Couldn't load PDFs: {error}. Make sure the <code>genome-lab</code> bucket exists in Supabase Storage and is set to public.
        </p>
      )}

      {!loading && !error && pdfs.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--cream-dim)]/25 p-10 text-center">
          <p className="mb-2 text-sm text-[var(--cream-dim)]">No PDFs yet.</p>
          <p className="text-xs text-[var(--cream-dim)]">Upload your cocktail genome lab PDFs using the button above.</p>
        </div>
      )}

      {!loading && pdfs.length > 0 && (
        <>
          {/* Carousel */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {pdfs.map((pdf, i) => {
              const title = pdf.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ")
              const isActive = i === activeIndex
              return (
                <button
                  key={pdf.name}
                  ref={(el) => { cardRefs.current[i] = el }}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setViewingIndex(i)
                    } else {
                      setActiveIndex(i)
                    }
                  }}
                  style={{ scrollSnapAlign: "center", flexShrink: 0 }}
                  className={`group relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "border-[var(--gold)]/70 shadow-lg shadow-[var(--gold)]/10"
                      : "border-[var(--cream-dim)]/15 opacity-60 hover:opacity-80"
                  }`}
                >
                  {/* PDF preview thumbnail */}
                  <div
                    className="relative overflow-hidden bg-white"
                    style={{ width: 180, height: 234 }}
                  >
                    <iframe
                      src={`${pdf.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      title={title}
                      tabIndex={-1}
                      style={{
                        width: 720,
                        height: 936,
                        transform: "scale(0.25)",
                        transformOrigin: "top left",
                        pointerEvents: "none",
                        border: "none",
                      }}
                    />
                    {/* Click-to-open overlay on active card */}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-medium text-[var(--on-gold)]">
                          Open
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div
                    className="px-2 py-2 text-center"
                    style={{ width: 180, background: "var(--surface-raised)" }}
                  >
                    <p className="truncate text-xs font-medium leading-snug">{title}</p>
                    {isActive && (
                      <p className="mt-0.5 text-xs text-[var(--cream-dim)]">tap to open</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Dot indicators + arrow nav */}
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="h-7 w-7 rounded-full border border-[var(--cream-dim)]/25 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]"
            >
              ←
            </button>
            <span className="text-xs text-[var(--cream-dim)]">
              {activeIndex + 1} / {pdfs.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.min(pdfs.length - 1, i + 1))}
              disabled={activeIndex === pdfs.length - 1}
              className="h-7 w-7 rounded-full border border-[var(--cream-dim)]/25 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]"
            >
              →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
