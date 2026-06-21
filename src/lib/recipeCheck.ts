import type {
  Ingredient,
  Recipe,
  RecipeCheckResult,
  RecipeIngredientStatus,
  Substitution,
} from "../types"

function norm(name: string) {
  return name.trim().toLowerCase()
}

export function checkRecipe(
  recipe: Recipe,
  ingredients: Ingredient[],
  substitutions: Substitution[],
): RecipeCheckResult {
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const byName = new Map(ingredients.map((i) => [norm(i.name), i]))
  const items: RecipeIngredientStatus[] = []
  const toPurchase: Ingredient[] = []
  let needsSubstitute = false
  let needsPurchase = false

  for (const ingredientId of recipe.ingredientIds) {
    const ingredient = byId.get(ingredientId)
    if (!ingredient) continue

    if (ingredient.inStock) {
      items.push({ ingredient, status: "have" })
      continue
    }

    // Substitution rules are typed freely and may not reference real stock, so they're matched
    // by name — only a rule whose substitute name also resolves to something in stock counts.
    const subs = substitutions.filter((s) => norm(s.ingredientName) === norm(ingredient.name))
    const availableSub = subs
      .map((s) => byName.get(norm(s.substituteName)))
      .find((sub) => sub && sub.inStock)

    if (availableSub) {
      items.push({ ingredient, status: "substitute", substitute: availableSub })
      needsSubstitute = true
    } else {
      items.push({ ingredient, status: "missing" })
      needsPurchase = true
      toPurchase.push(ingredient)
    }
  }

  const status = needsPurchase ? "purchase" : needsSubstitute ? "substitute" : "makeable"

  return { status, items, toPurchase }
}
