import type { Ingredient } from "../types"

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "")
}

// Not a real similarity score — just two cheap, explainable checks: one name
// contains the other (e.g. "aperol" is contained in "aperol aperitivo"), or
// they share the same first word (e.g. "aperol spritz" vs "aperol"). Either
// is treated as "probably the same thing, worth asking about" rather than
// assumed silently — the caller is responsible for getting confirmation.
export function findFuzzyMatch(rawName: string, ingredients: Ingredient[]): Ingredient | null {
  const target = normalize(rawName)
  if (target.length === 0) return null

  for (const ingredient of ingredients) {
    const candidate = normalize(ingredient.name)
    if (candidate === target) continue // exact matches are handled separately
    if (candidate.includes(target) || target.includes(candidate)) return ingredient
  }

  const targetFirstWord = target.split(" ")[0]
  for (const ingredient of ingredients) {
    const candidate = normalize(ingredient.name)
    if (candidate === target) continue
    if (candidate.split(" ")[0] === targetFirstWord) return ingredient
  }

  return null
}
