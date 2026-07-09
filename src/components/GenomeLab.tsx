import { useCallback, useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url"
import { supabase, GENOME_LAB_BUCKET } from "../lib/supabaseClient"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

interface PdfEntry { name: string; url: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function toTitleCase(s: string) {
  return s
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function getDisplayName(rawName: string, overrides: Record<string, string>) {
  return toTitleCase(overrides[rawName] ?? rawName)
}

function loadLocal<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") } catch { return fallback }
}
function saveLocal(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ── PDF thumbnail ─────────────────────────────────────────────────────────────

function PdfThumbnail({ url, width = 180 }: { url: string; width?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function render() {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        if (cancelled) return
        const scale = width / page.getViewport({ scale: 1 }).width
        const viewport = page.getViewport({ scale })
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, viewport }).promise
        if (!cancelled) setLoaded(true)
      } catch { /* ignore */ }
    }
    render()
    return () => { cancelled = true }
  }, [url, width])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width, opacity: loaded ? 1 : 0, transition: "opacity 0.2s ease", background: "#fff" }}
    />
  )
}

// ── Full-page canvas viewer ───────────────────────────────────────────────────

function PdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise
        if (cancelled) return
        setNumPages(pdf.numPages)
        for (let p = 1; p <= pdf.numPages; p++) {
          if (cancelled) break
          const page = await pdf.getPage(p)
          if (cancelled) break
          const container = containerRef.current
          if (!container) break
          const canvas = container.querySelector<HTMLCanvasElement>(`[data-page="${p}"]`)
          if (!canvas) break
          const scale = (container.clientWidth || 700) / page.getViewport({ scale: 1 }).width
          const viewport = page.getViewport({ scale })
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvas, viewport }).promise
        }
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [url])

  return (
    <div ref={containerRef} className="flex flex-col gap-1 overflow-y-auto rounded-lg bg-[var(--surface-raised)] p-2" style={{ flex: 1 }}>
      {numPages === 0 && <p className="py-10 text-center text-sm text-[var(--cream-dim)]">Loading…</p>}
      {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
        <canvas key={p} data-page={p} style={{ display: "block", width: "100%", background: "#fff", borderRadius: 4 }} />
      ))}
    </div>
  )
}

// ── Google Drive-style folder card ────────────────────────────────────────────

function FolderCard({ name, count, onClick, onDelete }: { name: string; count: number; onClick: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-start gap-1 rounded-xl border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-3 text-left hover:border-[var(--gold)]/40 transition-colors"
      style={{ width: 160, flexShrink: 0 }}
    >
      {/* Folder icon — Google Drive yellow style */}
      <svg width="48" height="40" viewBox="0 0 48 40" fill="none" className="mb-1">
        <path d="M2 10C2 7.8 3.8 6 6 6H18L22 10H42C44.2 10 46 11.8 46 14V34C46 36.2 44.2 38 42 38H6C3.8 38 2 36.2 2 34V10Z" fill="#FDD663"/>
        <path d="M2 14C2 11.8 3.8 10 6 10H42C44.2 10 46 11.8 46 14V34C46 36.2 44.2 38 42 38H6C3.8 38 2 36.2 2 34V14Z" fill="#FBBC04"/>
      </svg>
      <p className="w-full truncate text-xs font-medium">{name}</p>
      <p className="text-xs text-[var(--cream-dim)]">{count} {count === 1 ? "PDF" : "PDFs"}</p>
      {/* Delete button */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); if (confirmDelete) onDelete(); else setConfirmDelete(true) }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); if (confirmDelete) onDelete(); else setConfirmDelete(true) } }}
        className="absolute top-2 right-2 hidden rounded px-1 text-xs text-[var(--cream-dim)] hover:text-[var(--berry)] group-hover:block"
      >
        {confirmDelete ? "Sure?" : "✕"}
      </span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GenomeLab() {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)

  // Display name overrides (persisted)
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>(
    () => loadLocal("genome-lab-names", {})
  )
  // Editing state
  const [editingPdf, setEditingPdf] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)

  // Folders: { folderName: pdfName[] }
  const [folders, setFolders] = useState<Record<string, string[]>>(
    () => loadLocal("genome-lab-folders", {})
  )
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [folderMenuFor, setFolderMenuFor] = useState<string | null>(null) // pdf.name
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  // Upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carousel scroll
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollRafRef = useRef<number | null>(null)
  const scrollDirRef = useRef<number>(0) // -1 left, 0 none, 1 right

  // Letter jump refs: letter → first card index
  const letterIndexMap = useRef<Record<string, number>>({})
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Load PDFs ──────────────────────────────────────────────────────────────

  const loadPdfs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: listError } = await supabase.storage
      .from(GENOME_LAB_BUCKET)
      .list("", { limit: 300, sortBy: { column: "name", order: "asc" } })
    if (listError) { setError(listError.message); setLoading(false); return }
    const entries = (data ?? [])
      .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
      .map((f) => {
        const { data: u } = supabase.storage.from(GENOME_LAB_BUCKET).getPublicUrl(f.name)
        return { name: f.name, url: u.publicUrl }
      })
    setPdfs(entries)
    setLoading(false)
  }, [])

  useEffect(() => { loadPdfs() }, [loadPdfs])

  // ── Derived: visible PDFs sorted alphabetically ────────────────────────────

  const visiblePdfs = (
    activeFolder !== null
      ? pdfs.filter((p) => folders[activeFolder]?.includes(p.name))
      : pdfs
  ).slice().sort((a, b) =>
    getDisplayName(a.name, nameOverrides).localeCompare(getDisplayName(b.name, nameOverrides))
  )

  // Build letter → first index map
  useEffect(() => {
    const map: Record<string, number> = {}
    visiblePdfs.forEach((p, i) => {
      const letter = getDisplayName(p.name, nameOverrides)[0]?.toUpperCase() ?? "#"
      if (!(letter in map)) map[letter] = i
    })
    letterIndexMap.current = map
  })

  const availableLetters = Object.keys(letterIndexMap.current).sort()

  // ── Edge-hover auto-scroll ─────────────────────────────────────────────────

  function scrollTick() {
    const dir = scrollDirRef.current
    if (dir === 0) return
    carouselRef.current?.scrollBy({ left: dir * 12 })
    scrollRafRef.current = requestAnimationFrame(scrollTick)
  }

  function handleCarouselMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const edge = 80
    const prevDir = scrollDirRef.current
    if (x < edge) scrollDirRef.current = -1
    else if (x > rect.width - edge) scrollDirRef.current = 1
    else scrollDirRef.current = 0
    if (prevDir === 0 && scrollDirRef.current !== 0) {
      scrollRafRef.current = requestAnimationFrame(scrollTick)
    }
  }

  function handleCarouselMouseLeave() {
    scrollDirRef.current = 0
    if (scrollRafRef.current) { cancelAnimationFrame(scrollRafRef.current); scrollRafRef.current = null }
  }

  useEffect(() => () => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
  }, [])

  // ── Letter jump ────────────────────────────────────────────────────────────

  function jumpToLetter(letter: string) {
    const idx = letterIndexMap.current[letter]
    if (idx == null) return
    const card = cardRefs.current[idx]
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
  }

  // ── Rename ─────────────────────────────────────────────────────────────────

  function startEdit(pdfName: string) {
    setEditingPdf(pdfName)
    setEditValue(getDisplayName(pdfName, nameOverrides))
    setTimeout(() => editInputRef.current?.select(), 50)
  }

  function commitEdit() {
    if (!editingPdf) return
    const trimmed = editValue.trim()
    if (trimmed) {
      const updated = { ...nameOverrides, [editingPdf]: trimmed }
      setNameOverrides(updated)
      saveLocal("genome-lab-names", updated)
    }
    setEditingPdf(null)
  }

  // ── Folders ────────────────────────────────────────────────────────────────

  function createFolder(name: string) {
    if (!name.trim() || folders[name]) return
    const updated = { ...folders, [name.trim()]: [] }
    setFolders(updated)
    saveLocal("genome-lab-folders", updated)
    setCreatingFolder(false)
    setNewFolderName("")
  }

  function deleteFolder(name: string) {
    const updated = { ...folders }
    delete updated[name]
    setFolders(updated)
    saveLocal("genome-lab-folders", updated)
    if (activeFolder === name) setActiveFolder(null)
  }

  function toggleInFolder(folderName: string, pdfName: string) {
    const current = folders[folderName] ?? []
    const updated = {
      ...folders,
      [folderName]: current.includes(pdfName)
        ? current.filter((n) => n !== pdfName)
        : [...current, pdfName],
    }
    setFolders(updated)
    saveLocal("genome-lab-folders", updated)
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

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

  // ── Full viewer ────────────────────────────────────────────────────────────

  if (viewingIndex !== null && visiblePdfs[viewingIndex]) {
    const pdf = visiblePdfs[viewingIndex]
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setViewingIndex(null)} className="text-sm text-[var(--cream-dim)] hover:text-[var(--cream)]">
            ← Back
          </button>
          <p className="flex-1 truncate text-sm font-medium">{getDisplayName(pdf.name, nameOverrides)}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setViewingIndex((i) => Math.max(0, (i ?? 0) - 1))} disabled={viewingIndex === 0}
              className="h-8 rounded-md border border-[var(--cream-dim)]/25 px-3 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]">← Prev</button>
            <span className="text-xs text-[var(--cream-dim)]">{viewingIndex + 1} / {visiblePdfs.length}</span>
            <button type="button" onClick={() => setViewingIndex((i) => Math.min(visiblePdfs.length - 1, (i ?? 0) + 1))} disabled={viewingIndex === visiblePdfs.length - 1}
              className="h-8 rounded-md border border-[var(--cream-dim)]/25 px-3 text-xs disabled:opacity-30 hover:bg-[var(--surface-raised)]">Next →</button>
          </div>
        </div>
        <PdfViewer url={pdf.url} />
      </div>
    )
  }

  // ── Shelf view ─────────────────────────────────────────────────────────────

  return (
    <div onClick={() => { setFolderMenuFor(null) }}>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">
            {activeFolder ? (
              <span>
                <button type="button" onClick={() => setActiveFolder(null)} className="text-[var(--cream-dim)] hover:text-[var(--cream)]">
                  Genome Lab
                </button>
                {" / "}{activeFolder}
              </span>
            ) : "Genome Lab"}
          </h2>
          <p className="text-sm text-[var(--cream-dim)]">Click any PDF to open it. Double-click the title to rename.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCreatingFolder(true)}
            className="h-9 rounded-md border border-[var(--cream-dim)]/25 px-3 text-sm text-[var(--cream)] hover:bg-[var(--surface-raised)]">
            + Folder
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleUpload} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="h-9 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90 disabled:opacity-50">
            {uploading ? "Uploading…" : "Upload PDFs"}
          </button>
        </div>
      </div>

      {uploadError && <p className="mb-3 text-sm text-red-400">{uploadError}</p>}

      {/* New folder dialog */}
      {creatingFolder && (
        <div className="mb-4 flex items-center gap-2">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(newFolderName); if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName("") } }}
            placeholder="Folder name…"
            className="h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
          />
          <button type="button" onClick={() => createFolder(newFolderName)} className="h-9 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)]">Create</button>
          <button type="button" onClick={() => { setCreatingFolder(false); setNewFolderName("") }} className="text-sm text-[var(--cream-dim)] hover:text-[var(--cream)]">Cancel</button>
        </div>
      )}

      {/* Folders row (only on main shelf) */}
      {activeFolder === null && Object.keys(folders).length > 0 && (
        <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
          {Object.entries(folders).map(([name, members]) => (
            <FolderCard
              key={name}
              name={name}
              count={members.length}
              onClick={() => setActiveFolder(name)}
              onDelete={() => deleteFolder(name)}
            />
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-[var(--cream-dim)]">Loading shelf…</p>}
      {error && <p className="text-sm text-red-400">Couldn't load PDFs: {error}. Make sure the <code>genome-lab</code> bucket exists and is public.</p>}

      {!loading && !error && visiblePdfs.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--cream-dim)]/25 p-10 text-center">
          <p className="text-sm text-[var(--cream-dim)]">{activeFolder ? "No PDFs in this folder yet." : "No PDFs yet. Upload some above."}</p>
        </div>
      )}

      {!loading && visiblePdfs.length > 0 && (
        <>
          {/* Alphabet jump bar */}
          <div className="mb-3 flex flex-wrap gap-1">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => jumpToLetter(letter)}
                className="h-6 w-6 rounded text-xs font-medium text-[var(--cream-dim)] hover:bg-[var(--gold)]/20 hover:text-[var(--gold)] transition-colors"
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 select-none"
            style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
            onMouseMove={handleCarouselMouseMove}
            onMouseLeave={handleCarouselMouseLeave}
          >
            {visiblePdfs.map((pdf, i) => {
              const displayName = getDisplayName(pdf.name, nameOverrides)
              const inFolders = Object.entries(folders).filter(([, members]) => members.includes(pdf.name)).map(([n]) => n)
              const folderNames = Object.keys(folders)

              return (
                <div
                  key={pdf.name}
                  ref={(el) => { cardRefs.current[i] = el }}
                  style={{ scrollSnapAlign: "start", flexShrink: 0, width: 180 }}
                  className="group relative flex flex-col rounded-xl border border-[var(--cream-dim)]/15 overflow-hidden hover:border-[var(--gold)]/50 transition-colors"
                >
                  {/* Thumbnail — single click opens */}
                  <button
                    type="button"
                    onClick={() => setViewingIndex(i)}
                    className="block overflow-hidden bg-white"
                    style={{ height: 234, width: 180 }}
                  >
                    <PdfThumbnail url={pdf.url} width={180} />
                  </button>

                  {/* Title — double-click to edit */}
                  <div className="px-2 py-2 text-center" style={{ background: "var(--surface-raised)" }}>
                    {editingPdf === pdf.name ? (
                      <input
                        ref={editInputRef}
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingPdf(null) }}
                        className="w-full rounded border border-[var(--gold)]/50 bg-[var(--bg)] px-1 py-0.5 text-center text-xs text-[var(--cream)] outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p
                        className="truncate text-xs font-medium leading-snug cursor-text"
                        onDoubleClick={(e) => { e.stopPropagation(); startEdit(pdf.name) }}
                        title={displayName}
                      >
                        {displayName}
                      </p>
                    )}
                  </div>

                  {/* Folder tag + "⋯" menu */}
                  {folderNames.length > 0 && (
                    <div className="px-2 pb-2" style={{ background: "var(--surface-raised)" }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFolderMenuFor(folderMenuFor === pdf.name ? null : pdf.name) }}
                        className="w-full rounded text-xs text-[var(--cream-dim)] hover:text-[var(--cream)] transition-colors"
                      >
                        {inFolders.length > 0 ? `📁 ${inFolders.join(", ")}` : "Add to folder…"}
                      </button>
                      {folderMenuFor === pdf.name && (
                        <div
                          className="absolute bottom-full left-0 z-20 mb-1 w-full rounded-lg border border-[var(--cream-dim)]/20 bg-[var(--surface-raised)] py-1 shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {folderNames.map((fn) => (
                            <button
                              key={fn}
                              type="button"
                              onClick={() => toggleInFolder(fn, pdf.name)}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--gold)]/10"
                            >
                              <span>{folders[fn]?.includes(pdf.name) ? "✓" : " "}</span>
                              <span>{fn}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-1 text-center text-xs text-[var(--cream-dim)]">{visiblePdfs.length} PDF{visiblePdfs.length !== 1 ? "s" : ""}</p>
        </>
      )}
    </div>
  )
}
