import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  deleteRow,
  experimentFromDb,
  experimentToDb,
  fetchSiteLocked,
  fetchTable,
  ingredientFromDb,
  ingredientToDb,
  labQueueFromDb,
  labQueueToDb,
  recipeFromDb,
  recipeToDb,
  scanFromDb,
  scanToDb,
  setSiteLocked,
  substitutionFromDb,
  substitutionToDb,
  upsertRow,
  venueFromDb,
  venueToDb,
} from "../lib/db"
import { makeId } from "../lib/id"
import type { Experiment, Ingredient, LabQueueItem, Recipe, Scan, Substitution, Venue } from "../types"

interface DataContextValue {
  loading: boolean

  // Shared across every visitor (a single row in Supabase) — when true,
  // every add/update/remove function below becomes a no-op so the site is
  // genuinely read-only for everyone, not just whoever pressed the padlock.
  locked: boolean
  setLocked: (locked: boolean) => void

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
  const [loading, setLoading] = useState(true)
  const [locked, setLockedState] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [substitutions, setSubstitutions] = useState<Substitution[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [scans, setScans] = useState<Scan[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [labQueue, setLabQueue] = useState<LabQueueItem[]>([])

  // Everyone who opens this site reads the SAME Supabase project — this one
  // fetch on mount is what makes the data public/shared instead of stuck in
  // one browser's localStorage.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [ing, subs, ven, scn, rec, exp, queue, lockedNow] = await Promise.all([
        fetchTable<Record<string, unknown>>("ingredients"),
        fetchTable<Record<string, unknown>>("substitutions"),
        fetchTable<Record<string, unknown>>("venues"),
        fetchTable<Record<string, unknown>>("scans"),
        fetchTable<Record<string, unknown>>("recipes"),
        fetchTable<Record<string, unknown>>("experiments"),
        fetchTable<Record<string, unknown>>("lab_queue"),
        fetchSiteLocked(),
      ])
      if (cancelled) return
      setIngredients(ing.map(ingredientFromDb))
      setSubstitutions(subs.map(substitutionFromDb))
      setVenues(ven.map(venueFromDb))
      setScans(scn.map(scanFromDb))
      setRecipes(rec.map(recipeFromDb))
      setExperiments(exp.map(experimentFromDb))
      setLabQueue(queue.map(labQueueFromDb))
      setLockedState(lockedNow)
      setLoading(false)
    })().catch((err) => {
      console.error("Failed to load data from Supabase.", err)
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // The lock is shared across every visitor, so someone else pressing the
  // padlock needs to reach THIS browser too — short of wiring up Supabase
  // Realtime, a light poll is what keeps it from only updating on a hard
  // refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSiteLocked().then(setLockedState)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  function setLocked(next: boolean) {
    setLockedState(next)
    setSiteLocked(next)
  }

  // Every mutation below checks this first. Returning early before touching
  // either local state or Supabase is what makes "locked" mean nobody can
  // add/edit/delete anything, full stop — not just a UI suggestion that a
  // determined click could still get past.
  const value: DataContextValue = {
    loading,
    locked,
    setLocked,

    ingredients,
    addIngredient: (data) => {
      const ingredient = { ...data, id: makeId() }
      if (locked) return ingredient
      setIngredients((prev) => [...prev, ingredient])
      upsertRow("ingredients", ingredientToDb(ingredient))
      return ingredient
    },
    updateIngredient: (id, data) => {
      if (locked) return
      const updated = ingredients.find((i) => i.id === id)
      if (!updated) return
      const merged = { ...updated, ...data }
      setIngredients((prev) => prev.map((i) => (i.id === id ? merged : i)))
      upsertRow("ingredients", ingredientToDb(merged))
    },
    removeIngredient: (id) => {
      if (locked) return
      setIngredients((prev) => prev.filter((i) => i.id !== id))
      deleteRow("ingredients", id)
    },

    substitutions,
    addSubstitution: (data) => {
      if (locked) return
      const substitution = { ...data, id: makeId() }
      setSubstitutions((prev) => [...prev, substitution])
      upsertRow("substitutions", substitutionToDb(substitution))
    },
    removeSubstitution: (id) => {
      if (locked) return
      setSubstitutions((prev) => prev.filter((s) => s.id !== id))
      deleteRow("substitutions", id)
    },

    venues,
    addVenue: (data) => {
      const venue = { ...data, id: makeId() }
      if (locked) return venue
      setVenues((prev) => [...prev, venue])
      upsertRow("venues", venueToDb(venue))
      return venue
    },
    updateVenue: (id, data) => {
      if (locked) return
      const updated = venues.find((v) => v.id === id)
      if (!updated) return
      const merged = { ...updated, ...data }
      setVenues((prev) => prev.map((v) => (v.id === id ? merged : v)))
      upsertRow("venues", venueToDb(merged))
    },
    removeVenue: (id) => {
      if (locked) return
      // Scans/recipes referencing this venue cascade-delete in the database
      // automatically — these local filters just keep the UI in sync
      // immediately rather than waiting on the next fetch.
      setVenues((prev) => prev.filter((v) => v.id !== id))
      setScans((prev) => prev.filter((s) => s.venueId !== id))
      setRecipes((prev) => prev.filter((r) => r.venueId !== id))
      deleteRow("venues", id)
    },

    scans,
    addScan: (data) => {
      const scan = { ...data, id: makeId() }
      if (locked) return scan
      setScans((prev) => [...prev, scan])
      scanToDb(scan).then((row) => {
        upsertRow("scans", row)
        // Swap the in-memory photos (base64) for the real Storage URLs once
        // upload finishes, so a later edit doesn't re-upload them.
        setScans((prev) =>
          prev.map((s) => (s.id === scan.id ? { ...s, photos: row.photo_urls as string[] } : s)),
        )
      })
      return scan
    },
    updateScan: (id, data) => {
      if (locked) return
      const updated = scans.find((s) => s.id === id)
      if (!updated) return
      const merged = { ...updated, ...data }
      setScans((prev) => prev.map((s) => (s.id === id ? merged : s)))
      scanToDb(merged).then((row) => {
        upsertRow("scans", row)
        setScans((prev) =>
          prev.map((s) => (s.id === id ? { ...s, photos: row.photo_urls as string[] } : s)),
        )
      })
    },
    removeScan: (id) => {
      if (locked) return
      setScans((prev) => prev.filter((s) => s.id !== id))
      setRecipes((prev) => prev.filter((r) => r.scanId !== id))
      deleteRow("scans", id)
    },

    recipes,
    addRecipe: (data) => {
      const recipe = { ...data, id: makeId() }
      if (locked) return recipe
      setRecipes((prev) => [...prev, recipe])
      recipeToDb(recipe).then((row) => {
        upsertRow("recipes", row)
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipe.id ? { ...r, photo: (row.photo_url as string) ?? undefined } : r)),
        )
      })
      return recipe
    },
    updateRecipe: (id, data) => {
      if (locked) return
      const updated = recipes.find((r) => r.id === id)
      if (!updated) return
      const merged = { ...updated, ...data }
      setRecipes((prev) => prev.map((r) => (r.id === id ? merged : r)))
      recipeToDb(merged).then((row) => {
        upsertRow("recipes", row)
        setRecipes((prev) =>
          prev.map((r) => (r.id === id ? { ...r, photo: (row.photo_url as string) ?? undefined } : r)),
        )
      })
    },
    removeRecipe: (id) => {
      if (locked) return
      setRecipes((prev) => prev.filter((r) => r.id !== id))
      deleteRow("recipes", id)
    },

    experiments,
    addExperiment: (data) => {
      const experiment = { ...data, id: makeId() }
      if (locked) return experiment
      setExperiments((prev) => [...prev, experiment])
      experimentToDb(experiment).then((row) => {
        upsertRow("experiments", row)
        setExperiments((prev) =>
          prev.map((e) => (e.id === experiment.id ? { ...e, photos: row.photo_urls as string[] } : e)),
        )
      })
      return experiment
    },
    updateExperiment: (id, data) => {
      if (locked) return
      const updated = experiments.find((e) => e.id === id)
      if (!updated) return
      const merged = { ...updated, ...data }
      setExperiments((prev) => prev.map((e) => (e.id === id ? merged : e)))
      experimentToDb(merged).then((row) => {
        upsertRow("experiments", row)
        setExperiments((prev) =>
          prev.map((e) => (e.id === id ? { ...e, photos: row.photo_urls as string[] } : e)),
        )
      })
    },
    removeExperiment: (id) => {
      if (locked) return
      setExperiments((prev) => prev.filter((e) => e.id !== id))
      deleteRow("experiments", id)
    },

    deleteFlaggedIngredientName: (name) => {
      if (locked) return
      const lower = name.toLowerCase()
      const changed: Recipe[] = []
      setRecipes((prev) =>
        prev.map((r) => {
          if (!r.missingIngredientNames?.some((n) => n.toLowerCase() === lower)) return r
          const remaining = r.missingIngredientNames.filter((n) => n.toLowerCase() !== lower)
          const updated = { ...r, missingIngredientNames: remaining.length > 0 ? remaining : undefined }
          changed.push(updated)
          return updated
        }),
      )
      for (const r of changed) recipeToDb(r).then((row) => upsertRow("recipes", row))
    },

    labQueue,
    addToLabQueue: (data) => {
      const item = { ...data, id: makeId() }
      if (locked) return item
      setLabQueue((prev) => [...prev, item])
      upsertRow("lab_queue", labQueueToDb(item))
      return item
    },
    removeFromLabQueue: (id) => {
      if (locked) return
      setLabQueue((prev) => prev.filter((i) => i.id !== id))
      deleteRow("lab_queue", id)
    },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
