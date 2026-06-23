import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { compressDataUrl, useLocalStorageState, usePhotoSplitState } from "../lib/storage"
import { makeId } from "../lib/id"
import type { Experiment, Ingredient, LabQueueItem, Recipe, Scan, Substitution, Venue } from "../types"

// Anything bigger than this (a data URL noticeably larger than our own
// freshly-compressed output) is an old uncompressed photo worth shrinking.
const OVERSIZED_PHOTO_CHARS = 400_000

interface DataContextValue {
  ingredients: Ingredient[]
  addIngredient: (data: Omit<Ingredient, "id">) => Ingredient
  updateIngredient: (id: string, data: Partial<Ingredient>) => void
  removeIngredient: (id: string) => void

  substitutions: Substitution[]
  addSubstitution: (data: Omit<Substitution, "id">) => void
  removeSubstitution: (id: string) => void

  venues: Venue[]
  addVenue: (data: Omit<Venue, "id">) => Venue
  updateVenue: (id: string, data: Partial<Venue>) => void
  removeVenue: (id: string) => void

  scans: Scan[]
  addScan: (data: Omit<Scan, "id">) => Scan
  updateScan: (id: string, data: Partial<Scan>) => void
  removeScan: (id: string) => void

  recipes: Recipe[]
  addRecipe: (data: Omit<Recipe, "id">) => Recipe
  updateRecipe: (id: string, data: Partial<Recipe>) => void
  removeRecipe: (id: string) => void

  experiments: Experiment[]
  addExperiment: (data: Omit<Experiment, "id">) => Experiment
  updateExperiment: (id: string, data: Partial<Experiment>) => void
  removeExperiment: (id: string) => void

  // Permanently strips a flagged name from every recipe's
  // missingIngredientNames — used to delete a flagged entry outright rather
  // than just hiding it.
  deleteFlaggedIngredientName: (name: string) => void

  // Recipes sent over from a venue scan via "Send to Experiment Lab" — they
  // land here instead of jumping the user straight to that page, so they
  // show up under a heading there to review whenever they get to it.
  labQueue: LabQueueItem[]
  addToLabQueue: (data: Omit<LabQueueItem, "id">) => LabQueueItem
  removeFromLabQueue: (id: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useLocalStorageState<Ingredient[]>("ingredients", [])
  const [substitutions, setSubstitutions] = useLocalStorageState<Substitution[]>(
    "substitutions",
    [],
  )
  const [venues, setVenues] = useLocalStorageState<Venue[]>("venues", [])
  // scans + experiments carry photo blobs — persisted with photos split into
  // their own key so a photo-quota failure can never lose the entries.
  const [scans, setScans] = usePhotoSplitState<Scan>("scans", [])
  const [recipes, setRecipes] = useLocalStorageState<Recipe[]>("recipes", [])
  const [experiments, setExperiments] = usePhotoSplitState<Experiment>("experiments", [])
  const [labQueue, setLabQueue] = useLocalStorageState<LabQueueItem[]>("labQueue", [])

  // One-time-per-load migration: shrink any oversized photos left over from
  // before image compression existed. Those blobs fill the ~5MB localStorage
  // quota; once it's full, EVERY write fails — which is why newly entered
  // venue scans were silently lost on refresh. Re-compressing frees the
  // space so writes succeed again.
  const migratedRef = useRef(false)
  useEffect(() => {
    if (migratedRef.current) return
    migratedRef.current = true
    let cancelled = false

    async function shrink(urls: string[]): Promise<{ next: string[]; changed: boolean }> {
      let changed = false
      const next = await Promise.all(
        urls.map(async (u) => {
          if (u.length <= OVERSIZED_PHOTO_CHARS) return u
          const small = await compressDataUrl(u)
          if (small !== u && small.length < u.length) changed = true
          return small
        }),
      )
      return { next, changed }
    }

    ;(async () => {
      const expHasBig = experiments.some((e) => e.photos.some((p) => p.length > OVERSIZED_PHOTO_CHARS))
      const scanHasBig = scans.some((s) => s.photos.some((p) => p.length > OVERSIZED_PHOTO_CHARS))
      if (expHasBig) {
        const updated = await Promise.all(
          experiments.map(async (e) => {
            const { next, changed } = await shrink(e.photos)
            return changed ? { ...e, photos: next } : e
          }),
        )
        if (!cancelled) setExperiments(updated)
      }
      if (scanHasBig) {
        const updated = await Promise.all(
          scans.map(async (s) => {
            const { next, changed } = await shrink(s.photos)
            return changed ? { ...s, photos: next } : s
          }),
        )
        if (!cancelled) setScans(updated)
      }

      // Backfill: older menu recipes were promoted before photos were
      // snapshotted onto the recipe, so they show no image. Copy the photo
      // over from the source Archive experiment (matched by name) so it
      // persists on the recipe and shows on both menu pages.
      const photoByName = new Map(
        experiments.filter((e) => e.photos[0]).map((e) => [e.name.toLowerCase(), e.photos[0]]),
      )
      const needsBackfill = recipes.some(
        (r) => r.venueId === null && !r.photo && photoByName.has(r.name.toLowerCase()),
      )
      if (needsBackfill && !cancelled) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.venueId === null && !r.photo && photoByName.has(r.name.toLowerCase())
              ? { ...r, photo: photoByName.get(r.name.toLowerCase()) }
              : r,
          ),
        )
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: DataContextValue = {
    ingredients,
    addIngredient: (data) => {
      const ingredient = { ...data, id: makeId() }
      setIngredients((prev) => [...prev, ingredient])
      return ingredient
    },
    updateIngredient: (id, data) =>
      setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i))),
    removeIngredient: (id) => setIngredients((prev) => prev.filter((i) => i.id !== id)),

    substitutions,
    addSubstitution: (data) =>
      setSubstitutions((prev) => [...prev, { ...data, id: makeId() }]),
    removeSubstitution: (id) =>
      setSubstitutions((prev) => prev.filter((s) => s.id !== id)),

    venues,
    addVenue: (data) => {
      const venue = { ...data, id: makeId() }
      setVenues((prev) => [...prev, venue])
      return venue
    },
    updateVenue: (id, data) =>
      setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v))),
    removeVenue: (id) => {
      setVenues((prev) => prev.filter((v) => v.id !== id))
      setScans((prev) => prev.filter((s) => s.venueId !== id))
      setRecipes((prev) => prev.filter((r) => r.venueId !== id))
    },

    scans,
    addScan: (data) => {
      const scan = { ...data, id: makeId() }
      setScans((prev) => [...prev, scan])
      return scan
    },
    updateScan: (id, data) =>
      setScans((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s))),
    removeScan: (id) => {
      setScans((prev) => prev.filter((s) => s.id !== id))
      setRecipes((prev) => prev.filter((r) => r.scanId !== id))
    },

    recipes,
    addRecipe: (data) => {
      const recipe = { ...data, id: makeId() }
      setRecipes((prev) => [...prev, recipe])
      return recipe
    },
    updateRecipe: (id, data) =>
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r))),
    removeRecipe: (id) => setRecipes((prev) => prev.filter((r) => r.id !== id)),

    experiments,
    addExperiment: (data) => {
      const experiment = { ...data, id: makeId() }
      setExperiments((prev) => [...prev, experiment])
      return experiment
    },
    updateExperiment: (id, data) =>
      setExperiments((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e))),
    removeExperiment: (id) => setExperiments((prev) => prev.filter((e) => e.id !== id)),

    deleteFlaggedIngredientName: (name) => {
      const lower = name.toLowerCase()
      setRecipes((prev) =>
        prev.map((r) => {
          if (!r.missingIngredientNames?.some((n) => n.toLowerCase() === lower)) return r
          const remaining = r.missingIngredientNames.filter((n) => n.toLowerCase() !== lower)
          return { ...r, missingIngredientNames: remaining.length > 0 ? remaining : undefined }
        }),
      )
    },

    labQueue,
    addToLabQueue: (data) => {
      const item = { ...data, id: makeId() }
      setLabQueue((prev) => [...prev, item])
      return item
    },
    removeFromLabQueue: (id) => setLabQueue((prev) => prev.filter((i) => i.id !== id)),
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
