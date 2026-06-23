import { createContext, useContext, type ReactNode } from "react"
import { useLocalStorageState } from "../lib/storage"
import { makeId } from "../lib/id"
import type { Experiment, Ingredient, LabQueueItem, Recipe, Scan, Substitution, Venue } from "../types"

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
  const [scans, setScans] = useLocalStorageState<Scan[]>("scans", [])
  const [recipes, setRecipes] = useLocalStorageState<Recipe[]>("recipes", [])
  const [experiments, setExperiments] = useLocalStorageState<Experiment[]>("experiments", [])
  const [labQueue, setLabQueue] = useLocalStorageState<LabQueueItem[]>("labQueue", [])

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
