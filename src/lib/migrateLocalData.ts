// One-time, manual migration: pushes everything currently sitting in THIS
// browser's localStorage (built up over many sessions before Supabase was
// wired in) up into the shared Supabase project, uploading any base64
// photos to Storage along the way. Not run automatically — call it once
// from the browser console (`migrateLocalDataToSupabase()`) on the machine
// that actually has the real data, then never again. Safe to run twice:
// every row is upserted by id, so re-running just overwrites with the same
// data rather than duplicating it.
import {
  experimentToDb,
  ingredientToDb,
  labQueueToDb,
  recipeToDb,
  scanToDb,
  substitutionToDb,
  upsertRow,
  venueToDb,
} from "./db"
import type { Experiment, Ingredient, LabQueueItem, Recipe, Scan, Substitution, Venue } from "../types"

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// Mirrors the old usePhotoSplitState/usePhotoFieldSplitState read logic —
// photos may be split into a "<key>:photos" entry, or (for older data)
// still sitting inline on the entity itself.
function readPhotoSplitArray<T extends { id: string; photos: string[] }>(key: string): T[] {
  const meta = readJson<T[]>(key, [])
  const photoMap = readJson<Record<string, string[]>>(`${key}:photos`, {})
  return meta.map((e) => ({ ...e, photos: photoMap[e.id] ?? e.photos ?? [] }))
}

function readPhotoFieldSplitArray<T extends { id: string; photo?: string }>(key: string): T[] {
  const meta = readJson<T[]>(key, [])
  const photoMap = readJson<Record<string, string>>(`${key}:photos`, {})
  return meta.map((e) => ({ ...e, photo: photoMap[e.id] ?? e.photo }))
}

export async function migrateLocalDataToSupabase() {
  const ingredients = readJson<Ingredient[]>("ingredients", [])
  const substitutions = readJson<Substitution[]>("substitutions", [])
  const venues = readJson<Venue[]>("venues", [])
  const scans = readPhotoSplitArray<Scan>("scans")
  const recipes = readPhotoFieldSplitArray<Recipe>("recipes")
  const experiments = readPhotoSplitArray<Experiment>("experiments")
  const labQueue = readJson<LabQueueItem[]>("labQueue", [])

  const counts = {
    ingredients: ingredients.length,
    substitutions: substitutions.length,
    venues: venues.length,
    scans: scans.length,
    recipes: recipes.length,
    experiments: experiments.length,
    labQueue: labQueue.length,
  }
  console.log("Migrating local data to Supabase:", counts)

  // Venues/ingredients/substitutions/labQueue first (no photos, no FK
  // dependents) — then scans/recipes/experiments, whose *ToDb mappers
  // upload any base64 photos to Storage before the row is sent.
  for (const i of ingredients) await upsertRow("ingredients", ingredientToDb(i))
  for (const s of substitutions) await upsertRow("substitutions", substitutionToDb(s))
  for (const v of venues) await upsertRow("venues", venueToDb(v))
  for (const item of labQueue) await upsertRow("lab_queue", labQueueToDb(item))
  for (const s of scans) await upsertRow("scans", await scanToDb(s))
  for (const r of recipes) await upsertRow("recipes", await recipeToDb(r))
  for (const e of experiments) await upsertRow("experiments", await experimentToDb(e))

  console.log("Migration finished. Refresh the page to load from Supabase.", counts)
  return counts
}

if (typeof window !== "undefined") {
  ;(window as unknown as { migrateLocalDataToSupabase: typeof migrateLocalDataToSupabase }).migrateLocalDataToSupabase =
    migrateLocalDataToSupabase
}
