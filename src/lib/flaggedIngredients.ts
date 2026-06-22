import type { Recipe, Substitution } from "../types"

// Ingredient names referenced by scanned venue recipes that don't exist in
// stock and don't already have a substitution rule covering them. Once you
// add a substitution for a name (or delete it outright), it drops off this
// list on its own.
export function getFlaggedMissingIngredients(recipes: Recipe[], substitutions: Substitution[]): string[] {
  const covered = new Set(substitutions.map((s) => s.ingredientName.toLowerCase()))
  const flagged = new Set<string>()

  for (const recipe of recipes) {
    if (recipe.venueId === null) continue // only venue scans, not your own menu
    for (const name of recipe.missingIngredientNames ?? []) {
      if (!covered.has(name.toLowerCase())) flagged.add(name)
    }
  }

  return [...flagged].sort((a, b) => a.localeCompare(b))
}
