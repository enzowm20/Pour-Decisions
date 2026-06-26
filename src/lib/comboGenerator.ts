import { isLearnedPair, provenMembersWithin, type PairingGraph, type ProvenGroup } from "./learnedPairings"
import type { FlavorTag, Ingredient, IngredientCategory } from "../types"

export interface Combo {
  bySlot: Partial<Record<IngredientCategory, Ingredient[]>>
  learnedIds: Set<string>
}

function hasOverlap(a: string[], b: string[]) {
  return a.some((x) => b.includes(x))
}

export function signatureOf(ids: string[]) {
  return [...new Set(ids)].sort().join(",")
}

export function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Not a hard ceiling — these are sensible "how much of each is worth
// suggesting" amounts. A build can use a few of some categories but
// shouldn't pile on (one top-up is plenty; a couple of fruits/sweeteners at
// most). What keeps combos sane is that every extra still has to be a
// proven partner of the anchor, not just filling slots.
const SOFT_CAP: Record<string, number> = {
  spirit: 4,
  mixer: 3,
  citrus: 1,
  sweetener: 2,
  fruit: 2,
  other: 2,
}

// No single ingredient gets to anchor/pad out more than this many of the
// returned combos — once it's hit that, it's excluded from further rounds
// so later combos are forced to reach for different spirits/partners
// instead of recombining the same handful over and over.
const MAX_USES_PER_INGREDIENT = 2

// Shared by every "give me cocktail ideas for these tags" entry point on the
// Experiment Lab page — the flavour-profile picker, the occasion planner,
// and the random-cocktail button all build their suggestions the exact same
// strict way: archive-proven pairings preferred (or style overlap if there's
// no archive data at all yet), never repeating an existing experiment/menu
// item, and no single ingredient dominating the results.
export function buildCombos(
  tags: FlavorTag[],
  ingredients: Ingredient[],
  pairingGraph: PairingGraph,
  provenGroups: ProvenGroup[],
  knownSignatures: Set<string>,
  maxCombos: number,
): Combo[] {
  if (tags.length === 0) return []

  const flavorMatch = (i: Ingredient) => i.inStock && i.tags.some((t) => tags.includes(t))

  // Shuffled rather than alphabetical so repeated generations with the same
  // tags explore a different slice of the eligible pool instead of always
  // building the same combos in the same order.
  const spiritCandidates = shuffled(ingredients.filter((i) => i.category === "spirit" && flavorMatch(i)))
  if (spiritCandidates.length === 0) return []

  const otherCategories = ["mixer", "citrus", "sweetener", "fruit", "other"] as const
  const otherPool = shuffled(ingredients.filter((i) => i.category !== "spirit" && flavorMatch(i)))

  const haveArchiveData = pairingGraph.size > 0
  const learnedWith = (anchor: Ingredient, c: Ingredient) => isLearnedPair(pairingGraph, anchor.id, c.id)
  const styleWith = (anchor: Ingredient, c: Ingredient) => hasOverlap(anchor.styles ?? [], c.styles ?? [])
  const qualifies = (anchor: Ingredient, c: Ingredient) =>
    learnedWith(anchor, c) || (!haveArchiveData && styleWith(anchor, c))

  const usageCount = new Map<string, number>()
  const underCap = (ing: Ingredient) => (usageCount.get(ing.id) ?? 0) < MAX_USES_PER_INGREDIENT

  const seenSignatures = new Set<string>()
  const result: Combo[] = []

  let producedInLastRound = true
  while (result.length < maxCombos && producedInLastRound) {
    producedInLastRound = false

    for (const anchor of spiritCandidates) {
      if (result.length >= maxCombos) break
      if (!underCap(anchor)) continue

      const partners = otherPool
        .filter((c) => qualifies(anchor, c) && underCap(c))
        .sort((a, b) => Number(learnedWith(anchor, b)) - Number(learnedWith(anchor, a)))

      const extraSpirits = spiritCandidates.filter(
        (s) => s.id !== anchor.id && learnedWith(anchor, s) && underCap(s),
      )

      const bySlot: Combo["bySlot"] = {
        spirit: [anchor, ...extraSpirits.slice(0, SOFT_CAP.spirit - 1)],
      }
      const perCategory = new Map<string, number>()

      for (const c of partners) {
        const cat = c.category as (typeof otherCategories)[number]
        const used = perCategory.get(cat) ?? 0
        if (used >= (SOFT_CAP[cat] ?? 1)) continue
        perCategory.set(cat, used + 1)
        bySlot[cat] = [...(bySlot[cat] ?? []), c]
      }

      const total = Object.values(bySlot).flat().length
      if (total < 2) continue

      const allIds = Object.values(bySlot).flat().map((i) => i.id)
      const signature = signatureOf(allIds)
      if (seenSignatures.has(signature)) continue
      seenSignatures.add(signature)
      if (knownSignatures.has(signature)) continue

      for (const id of allIds) usageCount.set(id, (usageCount.get(id) ?? 0) + 1)

      const learnedIds = provenMembersWithin(provenGroups, new Set(allIds))
      result.push({ bySlot, learnedIds })
      producedInLastRound = true
    }
  }

  return result
}

// Rough, intentionally non-scientific "how confident is this" score — the
// fraction of a combo's ingredients that are archive-proven together (via a
// proven group), scaled into a percentage that never claims full certainty
// and never reads as a flat zero even with no archive data at all yet.
export function comboViability(combo: Combo, haveArchiveData: boolean): number {
  const allIds = Object.values(combo.bySlot).flat().map((i) => i.id)
  if (allIds.length === 0) return 0
  const provenFraction = combo.learnedIds.size / allIds.length
  const base = haveArchiveData ? 55 : 40
  const spread = haveArchiveData ? 40 : 25
  return Math.min(95, Math.round(base + provenFraction * spread))
}
