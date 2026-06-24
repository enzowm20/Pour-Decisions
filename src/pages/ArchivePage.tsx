import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useData } from "../context/DataContext"
import { fileToCompressedImage } from "../lib/storage"
import { byName } from "../lib/sort"
import IngredientPicker from "../components/IngredientPicker"
import FallingBottles from "../components/FallingBottles"
import RevealOnScroll from "../components/RevealOnScroll"
import ConfirmButton from "../components/ConfirmButton"
import jagerBottle from "../assets/jager-bottle.webp"
import type { ExperimentOutcome, FlavorTag, GlassType } from "../types"
import { FLAVOR_TAGS, GLASS_TYPES } from "../types"

const outcomeStyles: Record<ExperimentOutcome, string> = {
  worked: "bg-[var(--sage)] text-[var(--on-sage)]",
  "needs-work": "bg-[var(--gold)] text-[var(--on-gold)]",
  failed: "bg-[var(--berry)] text-[var(--on-berry)]",
}

export default function ArchivePage() {
  const { ingredients, experiments, addExperiment, updateExperiment, removeExperiment, recipes, addRecipe } =
    useData()
  const [searchParams, setSearchParams] = useSearchParams()

  const [name, setName] = useState(searchParams.get("name") ?? "")
  const [ingredientIds, setIngredientIds] = useState<string[]>(
    searchParams.get("ingredients")?.split(",").filter(Boolean) ?? [],
  )
  const [tags, setTags] = useState<FlavorTag[]>(
    (searchParams.get("tags")?.split(",").filter(Boolean) as FlavorTag[]) ?? [],
  )
  const [outcome, setOutcome] = useState<ExperimentOutcome>("worked")
  const [glass, setGlass] = useState<GlassType | "">("")
  const [garnish, setGarnish] = useState("")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])

  // Alphabetical "scrub" slider: 0 = A (show everything), 25 = Z. As you
  // slide right, every drink whose name starts before the current letter
  // drops away, leaving only that letter onward.
  const [letterFloor, setLetterFloor] = useState(0)
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const floorChar = ALPHABET[letterFloor]

  function toggleTag(tag: FlavorTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const urls = await Promise.all(files.map((f) => fileToCompressedImage(f)))
    setPhotos((prev) => [...prev, ...urls])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || ingredientIds.length === 0) return
    addExperiment({
      name: name.trim(),
      tags,
      ingredientIds,
      outcome,
      glass: glass || undefined,
      garnish: garnish.trim(),
      notes,
      photos,
      date: new Date().toISOString().slice(0, 10),
      promotedToMenu: false,
    })
    setName("")
    setIngredientIds([])
    setTags([])
    setGlass("")
    setGarnish("")
    setNotes("")
    setPhotos([])
    setSearchParams({})
  }

  function promote(experimentId: string) {
    const exp = experiments.find((e) => e.id === experimentId)
    if (!exp) return
    addRecipe({
      name: exp.name,
      venueId: null,
      scanId: null,
      ingredientIds: exp.ingredientIds,
      photo: exp.photos[0],
    })
    updateExperiment(experimentId, { promotedToMenu: true })
  }

  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const menuRecipeNames = new Set(recipes.filter((r) => r.venueId === null).map((r) => r.name))

  const inputClass =
    "h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"

  return (
    <div className="relative space-y-6">
      <FallingBottles bottleImg={jagerBottle} />
      <RevealOnScroll>
        <h1 className="mb-1 text-lg font-medium">Experiment Archive</h1>
        <p className="text-sm text-[var(--cream-dim)]">
          Log what you tried, what worked, and keep it on file for next time.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={100}>
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4"
      >
        <input
          className={`${inputClass} w-full`}
          placeholder="Experiment name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Ingredients</p>
          <IngredientPicker
            ingredients={ingredients}
            selectedIds={ingredientIds}
            onChange={setIngredientIds}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Flavor Tags</p>
          <div className="flex flex-wrap gap-2">
            {FLAVOR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs tag-glow ${
                  tags.includes(tag)
                    ? "tag-glow-on border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
                    : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Glass</p>
            <select
              className={`${inputClass} px-2`}
              value={glass}
              onChange={(e) => setGlass(e.target.value as GlassType)}
            >
              <option value="">Select glass...</option>
              {GLASS_TYPES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Garnish</p>
            <input
              className={`${inputClass} w-full`}
              placeholder="e.g. orange twist, mint sprig"
              value={garnish}
              onChange={(e) => setGarnish(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-[var(--cream-dim)]">Outcome</p>
          {(["worked", "needs-work", "failed"] as ExperimentOutcome[]).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={`rounded-full px-3 py-1 text-xs ${
                outcome === o ? outcomeStyles[o] : "bg-[var(--bg)] text-[var(--cream-dim)]"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        <textarea
          className="w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] p-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
          placeholder="Tasting notes..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="text-sm" />
        {photos.length > 0 && (
          <div className="flex gap-2">
            {photos.map((p, i) => (
              <img key={i} src={p} alt="" className="h-16 w-16 rounded-md object-cover" />
            ))}
          </div>
        )}

        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
        >
          Save experiment
        </button>
      </form>
      </RevealOnScroll>

      {experiments.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="w-6 text-center text-base font-medium text-[var(--gold)]">{floorChar}</span>
          <input
            type="range"
            min={0}
            max={25}
            value={letterFloor}
            onChange={(e) => setLetterFloor(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--gold)]"
            aria-label="Filter drinks from this letter onward"
          />
          <span className="text-xs text-[var(--cream-dim)]">showing {floorChar}–Z</span>
        </div>
      )}

      <div className="space-y-3">
        {experiments.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">No experiments logged yet.</p>
        )}
        {byName(experiments)
          .filter((exp) => {
            // At the leftmost position (A) show everything — the slider only
            // ever hides, never permanently drops a drink. Names starting
            // with a digit or symbol always show (they sort before A and
            // shouldn't be filtered out by a letter scrub).
            if (letterFloor === 0) return true
            const c = exp.name.trim()[0]?.toUpperCase() ?? ""
            if (c < "A" || c > "Z") return true
            return c >= floorChar
          })
          .map((exp, i) => (
            <RevealOnScroll
              key={exp.id}
              delay={Math.min(i, 8) * 60}
              className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4"
            >
              <div className="flex gap-3">
                {exp.photos[0] ? (
                  <img src={exp.photos[0]} alt="" className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="h-14 w-14 flex-shrink-0 rounded-md bg-[var(--bg)]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{exp.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${outcomeStyles[exp.outcome]}`}>
                      {exp.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--cream-dim)]/70">{exp.date}</p>
                  <p className="mt-1 text-xs text-[var(--cream-dim)]">
                    {exp.ingredientIds.map((id) => byId.get(id)?.name).filter(Boolean).join(", ")}
                  </p>
                  {(exp.glass || exp.garnish) && (
                    <p className="mt-1 text-xs text-[var(--cream-dim)]">
                      {exp.glass ? `Glass: ${exp.glass}` : ""}
                      {exp.glass && exp.garnish ? " · " : ""}
                      {exp.garnish ? `Garnish: ${exp.garnish}` : ""}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {exp.outcome === "worked" && !exp.promotedToMenu && !menuRecipeNames.has(exp.name) && (
                      <button
                        type="button"
                        onClick={() => promote(exp.id)}
                        className="text-xs text-[var(--teal)] hover:underline"
                      >
                        Add to my menu
                      </button>
                    )}
                    {(exp.promotedToMenu || menuRecipeNames.has(exp.name)) && (
                      <span className="text-xs text-[var(--sage)]">On your menu</span>
                    )}
                    <ConfirmButton
                      onConfirm={() => removeExperiment(exp.id)}
                      label="Remove"
                      className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                      confirmClassName="text-xs font-medium text-[var(--berry)]"
                    />
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
      </div>
    </div>
  )
}
