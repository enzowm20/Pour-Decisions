import type { Ingredient, Recipe } from "../types"

export function recipeCost(recipe: Recipe, ingredients: Ingredient[]): number {
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  return recipe.ingredientIds.reduce((sum, id) => sum + (byId.get(id)?.costPerServing ?? 0), 0)
}

export function margin(sellPrice: number, cost: number): number {
  return sellPrice - cost
}

export function marginPercent(sellPrice: number, cost: number): number | null {
  if (sellPrice <= 0) return null
  return ((sellPrice - cost) / sellPrice) * 100
}
