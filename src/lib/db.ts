import { supabase } from "./supabaseClient"
import { uploadPhotoIfNeeded } from "./storage"
import type { Experiment, Ingredient, LabQueueItem, Recipe, Scan, Substitution, Venue } from "../types"

// Thin camelCase(app) <-> snake_case(db) mapping per table, plus a couple of
// generic helpers shared by every entity in DataContext. Each entity's shape
// is different enough (which fields are arrays, which carry photos) that a
// single generic mapper would just be a pile of conditionals — these stay
// as plain, obvious functions instead.

export async function fetchTable<Row>(table: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select("*")
  if (error) throw error
  return (data ?? []) as Row[]
}

export async function upsertRow(table: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert(row)
  if (error) console.warn(`Couldn't save to "${table}" in Supabase.`, error)
}

export async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) console.warn(`Couldn't delete from "${table}" in Supabase.`, error)
}

export function ingredientToDb(i: Ingredient) {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    tags: i.tags,
    styles: i.styles,
    in_stock: i.inStock,
    cost_per_serving: i.costPerServing ?? null,
  }
}
export function ingredientFromDb(r: Record<string, unknown>): Ingredient {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Ingredient["category"],
    tags: (r.tags ?? []) as Ingredient["tags"],
    styles: (r.styles ?? []) as Ingredient["styles"],
    inStock: r.in_stock as boolean,
    costPerServing: (r.cost_per_serving as number | null) ?? undefined,
  }
}

export function substitutionToDb(s: Substitution) {
  return {
    id: s.id,
    ingredient_name: s.ingredientName,
    substitute_name: s.substituteName,
    note: s.note ?? null,
  }
}
export function substitutionFromDb(r: Record<string, unknown>): Substitution {
  return {
    id: r.id as string,
    ingredientName: r.ingredient_name as string,
    substituteName: r.substitute_name as string,
    note: (r.note as string | null) ?? undefined,
  }
}

export function venueToDb(v: Venue) {
  return { id: v.id, name: v.name }
}
export function venueFromDb(r: Record<string, unknown>): Venue {
  return { id: r.id as string, name: r.name as string }
}

export async function scanToDb(s: Scan) {
  const photoUrls = await Promise.all(
    s.photos.map((p) => uploadPhotoIfNeeded(p, `scans/${s.id}`)),
  )
  return {
    id: s.id,
    venue_id: s.venueId,
    date: s.date,
    photo_date: s.photoDate,
    photo_urls: photoUrls,
  }
}
export function scanFromDb(r: Record<string, unknown>): Scan {
  return {
    id: r.id as string,
    venueId: r.venue_id as string,
    date: r.date as string,
    photoDate: r.photo_date as string,
    photos: (r.photo_urls ?? []) as string[],
  }
}

export async function recipeToDb(rec: Recipe) {
  const photoUrl = rec.photo ? await uploadPhotoIfNeeded(rec.photo, `recipes/${rec.id}`) : null
  return {
    id: rec.id,
    name: rec.name,
    venue_id: rec.venueId,
    scan_id: rec.scanId,
    ingredient_ids: rec.ingredientIds,
    missing_ingredient_names: rec.missingIngredientNames ?? null,
    menu_category: rec.menuCategory ?? null,
    sell_price: rec.sellPrice ?? null,
    photo_url: photoUrl,
  }
}
export function recipeFromDb(r: Record<string, unknown>): Recipe {
  return {
    id: r.id as string,
    name: r.name as string,
    venueId: (r.venue_id as string | null) ?? null,
    scanId: (r.scan_id as string | null) ?? null,
    ingredientIds: (r.ingredient_ids ?? []) as string[],
    missingIngredientNames: (r.missing_ingredient_names as string[] | null) ?? undefined,
    menuCategory: (r.menu_category as Recipe["menuCategory"]) ?? undefined,
    sellPrice: (r.sell_price as number | null) ?? undefined,
    photo: (r.photo_url as string | null) ?? undefined,
  }
}

export async function experimentToDb(e: Experiment) {
  const photoUrls = await Promise.all(
    e.photos.map((p) => uploadPhotoIfNeeded(p, `experiments/${e.id}`)),
  )
  return {
    id: e.id,
    name: e.name,
    source_recipe_id: e.sourceRecipeId ?? null,
    tags: e.tags,
    ingredient_ids: e.ingredientIds,
    outcome: e.outcome,
    glass: e.glass ?? null,
    garnish: e.garnish,
    notes: e.notes,
    photo_urls: photoUrls,
    date: e.date,
    promoted_to_menu: e.promotedToMenu,
  }
}
export function experimentFromDb(r: Record<string, unknown>): Experiment {
  return {
    id: r.id as string,
    name: r.name as string,
    sourceRecipeId: (r.source_recipe_id as string | null) ?? undefined,
    tags: (r.tags ?? []) as Experiment["tags"],
    ingredientIds: (r.ingredient_ids ?? []) as string[],
    outcome: r.outcome as Experiment["outcome"],
    glass: (r.glass as Experiment["glass"]) ?? undefined,
    garnish: r.garnish as string,
    notes: r.notes as string,
    photos: (r.photo_urls ?? []) as string[],
    date: r.date as string,
    promotedToMenu: r.promoted_to_menu as boolean,
  }
}

export function labQueueToDb(item: LabQueueItem) {
  return { id: item.id, name: item.name, ingredient_ids: item.ingredientIds }
}
export function labQueueFromDb(r: Record<string, unknown>): LabQueueItem {
  return {
    id: r.id as string,
    name: r.name as string,
    ingredientIds: (r.ingredient_ids ?? []) as string[],
  }
}
