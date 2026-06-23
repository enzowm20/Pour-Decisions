import type { Ingredient, Recipe, Substitution } from "../types"

// Ingredient names referenced by scanned venue recipes that don't exist in
// stock and don't already have a substitution rule covering them. Once you
// add a substitution for a name, delete it outright, OR purchase it (add it
// to stock under that name), it drops off this list on its own.
export function getFlaggedMissingIngredients(
  recipes: Recipe[],
  substitutions: Substitution[],
  ingredients: Ingredient[] = [],
): string[] {
  const covered = new Set(substitutions.map((s) => s.ingredientName.toLowerCase()))
  const inStockNames = new Set(ingredients.map((i) => i.name.toLowerCase()))
  const flagged = new Set<string>()

  for (const recipe of recipes) {
    if (recipe.venueId === null) continue // only venue scans, not your own menu
    for (const name of recipe.missingIngredientNames ?? []) {
      const lower = name.toLowerCase()
      if (!covered.has(lower) && !inStockNames.has(lower)) flagged.add(name)
    }
  }

  return [...flagged].sort((a, b) => a.localeCompare(b))
}
