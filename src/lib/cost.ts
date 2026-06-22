import type { Ingredient, Recipe } from "../types"

// "costPerServing" on Ingredient is really each component's own solo sell
// price (a shot of this vodka on its own, a glass of this liqueur, etc) —
// not a wholesale purchase cost, since that's not something tracked here.
// So this isn't a true profit margin: it's "cocktail price vs. what you'd
// charge for the same components sold separately."
export function recipeComponentsSoloValue(recipe: Recipe, ingredients: Ingredient[]): number {
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  return recipe.ingredientIds.reduce((sum, id) => sum + (byId.get(id)?.costPerServing ?? 0), 0)
}

export function markup(sellPrice: number, soloValue: number): number {
  return sellPrice - soloValue
}

export function markupPercent(sellPrice: number, soloValue: number): number | null {
  if (sellPrice <= 0) return null
  return ((sellPrice - soloValue) / sellPrice) * 100
}
