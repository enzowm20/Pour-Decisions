import type { Recipe, Substitution } from "../types"

// Ingredient names referenced by scanned venue recipes that don't exist in
// stock, don't already have a substitution rule covering them, and haven't
// been explicitly dismissed ("we just don't stock this"). Once you add a
// substitution or ignore a name, it drops off this list on its own.
export function getFlaggedMissingIngredients(
  recipes: Recipe[],
  substitutions: Substitution[],
  ignored: string[] = [],
): string[] {
  const covered = new Set(substitutions.map((s) => s.ingredientName.toLowerCase()))
  const ignoredSet = new Set(ignored.map((n) => n.toLowerCase()))
  const flagged = new Set<string>()

  for (const recipe of recipes) {
    if (recipe.venueId === null) continue // only venue scans, not your own menu
    for (const name of recipe.missingIngredientNames ?? []) {
      const lower = name.toLowerCase()
      if (!covered.has(lower) && !ignoredSet.has(lower)) flagged.add(name)
    }
  }

  return [...flagged].sort((a, b) => a.localeCompare(b))
}
