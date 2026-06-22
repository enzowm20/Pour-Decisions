import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { buildPairingGraph, buildProvenGroups, isLearnedPair, provenMembersWithin } from "../lib/learnedPairings"
import { checkRecipe } from "../lib/recipeCheck"
import SubstitutionManager from "../components/SubstitutionManager"
import StatusBadge from "../components/StatusBadge"
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
  learnedIds: Set<string>
}

function hasOverlap(a: string[], b: string[]) {
  return a.some((x) => b.includes(x))
}

function pickN<T>(list: T[], n: number, offset: number): T[] {
  const result: T[] = []
  for (let i = 0; i < n; i++) result.push(list[(offset + i) % list.length])
  return result
}

function signatureOf(ids: string[]) {
  return [...new Set(ids)].sort().join(",")
}

export default function ExperimentLabPage() {
  const { ingredients, experiments, recipes, substitutions } = useData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedTags, setSelectedTags] = useState<FlavorTag[]>([])

  const pairingGraph = useMemo(() => buildPairingGraph(experiments), [experiments])
  const provenGroups = useMemo(() => buildProvenGroups(experiments), [experiments])

  // Every combination that already exists — as a logged experiment or on any
  // venue's menu (yours or one you've scanned) — so suggestions stay genuinely
  // new rather than re-proposing something already on file.
  const knownSignatures = useMemo(() => {
    const sigs = new Set<string>()
    for (const e of experiments) sigs.add(signatureOf(e.ingredientIds))
    for (const r of recipes) sigs.add(signatureOf(r.ingredientIds))
    return sigs
  }, [experiments, recipes])

  const stagedName = searchParams.get("name")
  const stagedIngredientIds = searchParams.get("ingredients")?.split(",").filter(Boolean) ?? []
  const stagedRecipe =
    stagedName && stagedIngredientIds.length > 0
      ? { id: "staged", name: stagedName, venueId: null, scanId: null, ingredientIds: stagedIngredientIds }
      : null
  const stagedResult = stagedRecipe ? checkRecipe(stagedRecipe, ingredients, substitutions) : null

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

    // Two ingredients are allowed in the same combo if they share a style tag
    // OR if they've actually appeared together in a "worked" archive entry —
    // the learned pairing is what lets the lab improve as you log more.
    const compatible = (anchor: Ingredient, candidate: Ingredient) =>
      hasOverlap(anchor.styles ?? [], candidate.styles ?? []) ||
      isLearnedPair(pairingGraph, anchor.id, candidate.id)

    const MAX_COMBOS = 10
    const MAX_ATTEMPTS = 120 // higher than MAX_COMBOS since known combos get rejected and don't count
    const seenSignatures = new Set<string>()
    const result: Combo[] = []

    for (let attempt = 0; attempt < MAX_ATTEMPTS && result.length < MAX_COMBOS; attempt++) {
      const anchor = spiritCandidates[attempt % spiritCandidates.length]
      const offset = attempt

      const bySlot: Combo["bySlot"] = {}

      const additionalSpirits = spiritCandidates.filter(
        (i) => i.id !== anchor.id && compatible(anchor, i),
      )
      const spiritCount = Math.min(CAPS.spirit - 1, additionalSpirits.length)
      bySlot.spirit = [anchor, ...pickN(additionalSpirits, spiritCount, offset)]

      for (const category of ["mixer", "citrus", "sweetener", "other"] as const) {
        const pool = otherCategoryPools[category].filter((i) => compatible(anchor, i))
        if (pool.length === 0) continue // no qualifying match — skip the slot entirely
        const count = Math.min(CAPS[category], pool.length)
        bySlot[category] = pickN(pool, count, offset)
      }

      const allIds = Object.values(bySlot)
        .flat()
        .map((i) => i.id)
      const signature = signatureOf(allIds)
      if (seenSignatures.has(signature)) continue
      seenSignatures.add(signature)

      // Skip anything that's already a known recipe — the point of this page
      // is to surface combinations that don't exist yet.
      if (knownSignatures.has(signature)) continue

      // Badge a whole proven group (2, 3, or more ingredients) rather than
      // tagging ingredients one at a time against the anchor — this is what
      // tells a real 3+ ingredient win apart from three separate pairs.
      const learnedIds = provenMembersWithin(provenGroups, new Set(allIds))

      result.push({ bySlot, learnedIds })
    }

    return result
  }, [ingredients, selectedTags, pairingGraph, provenGroups, knownSignatures])

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

  function tryStaged() {
    if (!stagedRecipe) return
    const params = new URLSearchParams({
      name: stagedRecipe.name,
      ingredients: stagedRecipe.ingredientIds.join(","),
    })
    navigate(`/archive?${params.toString()}`)
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium">Build A Flavor Profile</h1>
      <p className="mb-4 text-sm text-[var(--cream-dim)]">
        Select flavor tags to get combinations from your stocked ingredients. Ingredients combine
        if they share a flavor tag and either a cocktail style or a pairing you've already logged
        as "worked" in the archive. Anything that already matches an existing experiment or menu
        item is skipped — these are meant to be genuinely new, not a recipe you already have on
        file.
      </p>

      {stagedRecipe && stagedResult && (
        <div className="mb-6 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-[var(--cream-dim)]">Sent from a venue scan</p>
              <p className="text-sm font-medium">{stagedRecipe.name}</p>
            </div>
            <StatusBadge status={stagedResult.status} />
          </div>
          <p className="mb-2 text-xs text-[var(--cream-dim)]">
            {stagedResult.items.map((item, i) => (
              <span key={i}>
                {i > 0 ? ", " : ""}
                {item.status === "have" ? (
                  item.ingredient.name
                ) : (
                  <span className="text-[var(--cream-dim)] line-through">{item.ingredient.name}</span>
                )}
              </span>
            ))}
          </p>
          {stagedResult.items.some((i) => i.status === "substitute") && (
            <p className="mb-2 text-xs text-[var(--cream-dim)]">
              {stagedResult.items
                .filter((i) => i.status === "substitute")
                .map((i) => `We have ${i.substitute?.name} — use it in place of ${i.ingredient.name}`)
                .join(". ")}
              . Add more swaps below if something else is missing.
            </p>
          )}
          {stagedResult.toPurchase.length > 0 && (
            <p className="mb-2 text-xs text-[var(--cream-dim)]">
              No substitute on file for {stagedResult.toPurchase.map((i) => i.name).join(", ")} —
              add one below, or buy it to make this as written.
            </p>
          )}
          <button
            type="button"
            onClick={tryStaged}
            className="h-8 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90"
          >
            Try this
          </button>
        </div>
      )}

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
                        <li key={ing.id}>
                          {ing.name}
                          {combo.learnedIds.has(ing.id) && (
                            <span className="ml-1.5 rounded-full bg-[var(--sage)]/20 px-1.5 py-0.5 text-[10px] text-[var(--sage)]">
                              proven
                            </span>
                          )}
                        </li>
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
            No new combinations available yet — either nothing in stock is tagged with these
            flavors, or every match already exists in your archive or a menu.
          </p>
        )}
      </div>

      <div className="mt-8 border-t border-[var(--cream-dim)]/15 pt-6">
        <SubstitutionManager />
      </div>
    </div>
  )
}
