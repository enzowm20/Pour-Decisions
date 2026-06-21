import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { FLAVOR_TAGS, type FlavorTag, type Ingredient, type IngredientCategory } from "../types"

const CAPS: Record<IngredientCategory, number> = {
  spirit: 4,
  mixer: 4,
  citrus: 1,
  sweetener: 2,
  other: 1,
}

const LABELS: Record<IngredientCategory, string> = {
  spirit: "Spirits",
  mixer: "Mixers",
  citrus: "Citrus",
  sweetener: "Sweeteners",
  other: "Top-up",
}

// Render order for whichever categories happen to be present in a combo.
const DISPLAY_ORDER: IngredientCategory[] = ["spirit", "mixer", "citrus", "sweetener", "other"]

interface Combo {
  bySlot: Partial<Record<IngredientCategory, Ingredient[]>>
}

function hasOverlap(a: string[], b: string[]) {
  return a.some((x) => b.includes(x))
}

function pickN<T>(list: T[], n: number, offset: number): T[] {
  const result: T[] = []
  for (let i = 0; i < n; i++) result.push(list[(offset + i) % list.length])
  return result
}

export default function ExperimentLabPage() {
  const { ingredients } = useData()
  const navigate = useNavigate()
  const [selectedTags, setSelectedTags] = useState<FlavorTag[]>([])

  function toggleTag(tag: FlavorTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const combos = useMemo<Combo[]>(() => {
    if (selectedTags.length === 0) return []

    const flavorMatch = (i: Ingredient) => i.inStock && i.tags.some((t) => selectedTags.includes(t))

    const spiritCandidates = byName(
      ingredients.filter((i) => i.category === "spirit" && flavorMatch(i)),
    )
    if (spiritCandidates.length === 0) return []

    const otherCategoryPools: Record<string, Ingredient[]> = {
      mixer: byName(ingredients.filter((i) => i.category === "mixer" && flavorMatch(i))),
      citrus: byName(ingredients.filter((i) => i.category === "citrus" && flavorMatch(i))),
      sweetener: byName(ingredients.filter((i) => i.category === "sweetener" && flavorMatch(i))),
      other: byName(ingredients.filter((i) => i.category === "other" && flavorMatch(i))),
    }

    const MAX_COMBOS = 10
    const MAX_ATTEMPTS = 60
    const seenSignatures = new Set<string>()
    const result: Combo[] = []

    for (let attempt = 0; attempt < MAX_ATTEMPTS && result.length < MAX_COMBOS; attempt++) {
      const anchor = spiritCandidates[attempt % spiritCandidates.length]
      const anchorStyles = anchor.styles ?? []
      const offset = attempt

      const bySlot: Combo["bySlot"] = {}

      // Other spirits only join the anchor if they actually share a style
      // with it (e.g. vodka + Chambord for a French Martini) — never just
      // because both happen to be "sweet" or "boozy".
      const additionalSpirits = spiritCandidates.filter(
        (i) => i.id !== anchor.id && hasOverlap(anchorStyles, i.styles ?? []),
      )
      const spiritCount = Math.min(CAPS.spirit - 1, additionalSpirits.length)
      bySlot.spirit = [anchor, ...pickN(additionalSpirits, spiritCount, offset)]

      for (const category of ["mixer", "citrus", "sweetener", "other"] as const) {
        const pool = otherCategoryPools[category].filter((i) =>
          hasOverlap(anchorStyles, i.styles ?? []),
        )
        if (pool.length === 0) continue // no qualifying match — skip the slot entirely
        const count = Math.min(CAPS[category], pool.length)
        bySlot[category] = pickN(pool, count, offset)
      }

      const signature = Object.values(bySlot)
        .flat()
        .map((i) => i.id)
        .sort()
        .join(",")
      if (seenSignatures.has(signature)) continue

      seenSignatures.add(signature)
      result.push({ bySlot })
    }

    return result
  }, [ingredients, selectedTags])

  function tryCombo(combo: Combo) {
    const ingredientIds = Object.values(combo.bySlot)
      .flat()
      .filter((i): i is Ingredient => Boolean(i))
      .map((i) => i.id)
    const params = new URLSearchParams({
      ingredients: ingredientIds.join(","),
      tags: selectedTags.join(","),
    })
    navigate(`/archive?${params.toString()}`)
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium">Build A Flavor Profile</h1>
      <p className="mb-4 text-sm text-[var(--cream-dim)]">
        Select flavor tags to get combinations from your stocked ingredients. Ingredients only
        combine if they share a flavor tag and a cocktail style with each other — set both on the
        Stock page for this to suggest things that actually make sense. Categories with no
        qualifying match are left out rather than forced.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FLAVOR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              selectedTags.includes(tag)
                ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTags.length === 0 && (
        <p className="text-sm text-[var(--cream-dim)]">Select at least one tag to see suggestions.</p>
      )}

      <div className="space-y-3">
        {combos.map((combo, i) => {
          const presentCategories = DISPLAY_ORDER.filter((c) => (combo.bySlot[c] ?? []).length > 0)
          return (
            <div key={i} className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
              <div className="mb-3 flex flex-wrap gap-4">
                {presentCategories.map((category) => (
                  <div key={category}>
                    <p className="text-[11px] text-[var(--cream-dim)]">{LABELS[category]}</p>
                    <ul className="text-sm">
                      {(combo.bySlot[category] ?? []).map((ing) => (
                        <li key={ing.id}>{ing.name}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[11px] text-[var(--gold)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => tryCombo(combo)}
                  className="h-8 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90"
                >
                  Try this
                </button>
              </div>
            </div>
          )
        })}
        {selectedTags.length > 0 && combos.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">
            No spirits in stock are tagged with these flavors yet. Go to the Stock page and add
            flavor tags to your spirits.
          </p>
        )}
      </div>
    </div>
  )
}
