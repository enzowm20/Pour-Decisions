import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useData } from "../context/DataContext"
import { fileToDataUrl } from "../lib/storage"
import { byName } from "../lib/sort"
import { SEED_EXPERIMENTS, SEED_INGREDIENTS } from "../lib/fiddlerImport"
import IngredientPicker from "../components/IngredientPicker"
import type { ExperimentOutcome, FlavorTag, GlassType } from "../types"
import { FLAVOR_TAGS, GLASS_TYPES } from "../types"

const outcomeStyles: Record<ExperimentOutcome, string> = {
  worked: "bg-[var(--sage)] text-[var(--on-sage)]",
  "needs-work": "bg-[var(--gold)] text-[var(--on-gold)]",
  failed: "bg-[var(--berry)] text-[var(--on-berry)]",
}

export default function ArchivePage() {
  const {
    ingredients,
    addIngredient,
    experiments,
    addExperiment,
    updateExperiment,
    removeExperiment,
    recipes,
    addRecipe,
  } = useData()
  const [searchParams, setSearchParams] = useSearchParams()

  const [name, setName] = useState("")
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
  const [importStatus, setImportStatus] = useState("")

  function importFiddlerMenu() {
    const nameToId = new Map(ingredients.map((i) => [i.name.toLowerCase(), i.id]))
    let newIngredients = 0

    for (const seed of SEED_INGREDIENTS) {
      const key = seed.name.toLowerCase()
      if (nameToId.has(key)) continue
      const created = addIngredient({
        name: seed.name,
        category: seed.category,
        tags: seed.tags,
        styles: seed.styles,
        inStock: true,
      })
      nameToId.set(key, created.id)
      newIngredients++
    }

    const existingExperimentNames = new Set(experiments.map((e) => e.name.toLowerCase()))
    let newExperiments = 0

    for (const seed of SEED_EXPERIMENTS) {
      if (existingExperimentNames.has(seed.name.toLowerCase())) continue
      const ingredientIds = seed.ingredientNames
        .map((n) => nameToId.get(n.toLowerCase()))
        .filter((id): id is string => Boolean(id))

      addExperiment({
        name: seed.name,
        tags: seed.tags,
        ingredientIds,
        outcome: "worked",
        glass: seed.glass,
        garnish: seed.garnish,
        notes: seed.notes,
        photos: [],
        date: new Date().toISOString().slice(0, 10),
        promotedToMenu: false,
      })
      newExperiments++
    }

    setImportStatus(
      `Imported ${newExperiments} recipe${newExperiments === 1 ? "" : "s"} and added ${newIngredients} new ingredient${newIngredients === 1 ? "" : "s"} from the Fiddler menu.`,
    )
  }

  function toggleTag(tag: FlavorTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const urls = await Promise.all(files.map(fileToDataUrl))
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
    addRecipe({ name: exp.name, venueId: null, scanId: null, ingredientIds: exp.ingredientIds })
    updateExperiment(experimentId, { promotedToMenu: true })
  }

  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const menuRecipeNames = new Set(recipes.filter((r) => r.venueId === null).map((r) => r.name))

  const inputClass =
    "h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-lg font-medium">Experiment Archive</h1>
        <p className="text-sm text-[var(--cream-dim)]">
          Log what you tried, what worked, and keep it on file for next time.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
        <p className="mb-1 text-sm font-medium">Import Fiddler Cocktail Menu (2027)</p>
        <p className="mb-3 text-xs text-[var(--cream-dim)]">
          Adds every recipe from the PDF as a "worked" experiment, creating any missing
          ingredients (tagged with flavor and style) along the way. Safe to run more than once —
          existing ingredients and experiments with matching names are skipped.
        </p>
        <button
          type="button"
          onClick={importFiddlerMenu}
          className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
        >
          Import menu
        </button>
        {importStatus && <p className="mt-2 text-xs text-[var(--sage)]">{importStatus}</p>}
      </div>

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
                className={`rounded-full border px-3 py-1 text-xs ${
                  tags.includes(tag)
                    ? "border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
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

      <div className="space-y-3">
        {experiments.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">No experiments logged yet.</p>
        )}
        {byName(experiments)
          .map((exp) => (
            <div key={exp.id} className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
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
                  {exp.notes && <p className="mt-1 text-sm text-[var(--cream)]">{exp.notes}</p>}
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
                    <button
                      type="button"
                      onClick={() => removeExperiment(exp.id)}
                      className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
