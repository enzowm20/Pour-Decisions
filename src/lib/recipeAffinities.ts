import { COCKTAILS, MOCKTAILS } from "../data/menuRecipes"

const coOccurrence = new Map<string, number>()

for (const recipe of [...COCKTAILS, ...MOCKTAILS]) {
  const items = recipe.ingredients.map((i: { item: string }) => i.item.toLowerCase())
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      const key = [items[a], items[b]].sort().join("|")
      coOccurrence.set(key, (coOccurrence.get(key) ?? 0) + 1)
    }
  }
}

export function minedAffinity(nameA: string, nameB: string): boolean {
  const a = nameA.toLowerCase()
  const b = nameB.toLowerCase()
  const key = [a, b].sort().join("|")
  return (coOccurrence.get(key) ?? 0) >= 2
}
