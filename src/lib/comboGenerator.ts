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

// ── Spirit classification ─────────────────────────────────────────────────────
// Base spirits are high-ABV foundations that can anchor a cocktail on their
// own. Modifier spirits (liqueurs, aperitifs, digestifs) have strong flavour
// but can't carry a drink alone — they must always appear alongside a base.
const BASE_SPIRIT_TOKENS = [
  "gin", "vodka", "tequila", "mezcal", "rum", "whiskey", "whisky", "bourbon",
  "scotch", "rye", "brandy", "cognac", "pisco", "cachaca", "cachaça", "baijiu",
  "sake", "shochu", "soju", "aquavit", "akvavit", "absinthe", "grappa",
  "calvados", "armagnac", "calvados", "marc", "eau de vie",
]

function isBaseSpirit(name: string): boolean {
  const lower = name.toLowerCase()
  return BASE_SPIRIT_TOKENS.some((t) => lower.includes(t))
}

// ── Classic cocktail affinity knowledge ──────────────────────────────────────
// When there is no archive data yet, the system falls back to style overlap.
// This layer provides a third tier: known-good ingredient affinities derived
// from classic cocktail structures, so suggestions feel informed rather than
// random even on a fresh install.
//
// Keys are lowercase fragments matched against ingredient names.
// Values are name fragments of ingredients that classically pair well.
const CLASSIC_AFFINITY: Array<[string[], string[]]> = [
  // Gin → citrus, tonic, elderflower, cucumber, florals
  [["gin"], ["lemon", "lime", "tonic", "elderflower", "cucumber", "grapefruit", "rosemary", "basil"]],
  // Vodka → citrus, cranberry, elderflower, ginger beer, espresso
  [["vodka"], ["lemon", "lime", "cranberry", "elderflower", "ginger beer", "espresso", "peach", "pineapple"]],
  // Tequila / mezcal → lime, agave, grapefruit, orange, chili
  [["tequila", "mezcal"], ["lime", "agave", "grapefruit", "orange", "triple sec", "cointreau", "chili", "jalapeño"]],
  // Rum → lime, sugar, mint, tropical fruit, pineapple
  [["rum"], ["lime", "sugar", "mint", "pineapple", "mango", "coconut", "passionfruit", "ginger beer"]],
  // Whiskey / bourbon / scotch / rye → lemon, honey, ginger, bitters, orange
  [["whiskey", "whisky", "bourbon", "scotch", "rye"], ["lemon", "honey", "ginger", "orange", "bitters", "apple", "maple"]],
  // Brandy / cognac → lemon, orange, triple sec, apple
  [["brandy", "cognac", "armagnac", "calvados"], ["lemon", "orange", "triple sec", "apple", "peach", "honey"]],
  // Pisco → lime, lemon, egg white
  [["pisco"], ["lime", "lemon", "egg white", "sugar", "bitters"]],
  // Modifier spirits — always need a base plus these partners
  [["limoncello"], ["gin", "vodka", "lemon", "prosecco", "elderflower"]],
  [["elderflower", "st germain", "st-germain"], ["gin", "vodka", "lemon", "lime", "cucumber", "prosecco"]],
  [["aperol"], ["prosecco", "soda", "orange", "gin"]],
  [["campari"], ["gin", "vermouth", "orange", "grapefruit"]],
  [["amaretto"], ["bourbon", "lemon", "orange", "almond"]],
  [["triple sec", "cointreau", "curacao"], ["tequila", "gin", "vodka", "lime", "lemon", "orange"]],
  [["kahlúa", "kahlua", "coffee liqueur"], ["vodka", "rum", "espresso", "cream"]],
  [["baileys", "irish cream"], ["vodka", "rum", "espresso", "chocolate", "cream"]],
  [["chambord", "raspberry liqueur"], ["vodka", "gin", "lemon", "prosecco"]],
  [["peach schnapps"], ["vodka", "cranberry", "orange", "peach"]],
  [["passionfruit liqueur", "passoa"], ["vodka", "rum", "lime", "passionfruit", "prosecco"]],
]

// Returns true if `target` is classically affine with `anchor` based on the
// knowledge table above.
function classicAffinity(anchor: Ingredient, target: Ingredient): boolean {
  const aName = anchor.name.toLowerCase()
  const tName = target.name.toLowerCase()
  for (const [keys, partners] of CLASSIC_AFFINITY) {
    if (keys.some((k) => aName.includes(k))) {
      if (partners.some((p) => tName.includes(p))) return true
    }
    // Also check the reverse — if the target has affinity rules, does the
    // anchor appear in its partners list?
    if (keys.some((k) => tName.includes(k))) {
      if (partners.some((p) => aName.includes(p))) return true
    }
  }
  return false
}

// Not a hard ceiling — these are sensible "how much of each is worth
// suggesting" amounts.
const SOFT_CAP: Record<string, number> = {
  spirit: 3,
  mixer: 2,
  citrus: 1,
  sweetener: 2,
  fruit: 2,
  other: 2,
}

const MAX_USES_PER_INGREDIENT = 2

// Shared by every "give me cocktail ideas" entry point on the Experiment Lab.
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

  const spiritCandidates = shuffled(ingredients.filter((i) => i.category === "spirit" && flavorMatch(i)))
  if (spiritCandidates.length === 0) return []

  // All in-stock non-spirit ingredients — used for the baseline fill below.
  const allInStock = ingredients.filter((i) => i.inStock)
  const allBaseSpirits = allInStock.filter((i) => i.category === "spirit" && isBaseSpirit(i.name))

  const otherCategories = ["mixer", "citrus", "sweetener", "fruit", "other"] as const
  const otherPool = shuffled(ingredients.filter((i) => i.category !== "spirit" && flavorMatch(i)))

  const haveArchiveData = pairingGraph.size > 0
  const learnedWith = (anchor: Ingredient, c: Ingredient) => isLearnedPair(pairingGraph, anchor.id, c.id)
  const styleWith = (anchor: Ingredient, c: Ingredient) => hasOverlap(anchor.styles ?? [], c.styles ?? [])

  // Three-tier qualification: archive proven > style overlap > classic affinity.
  // Classic affinity fires whether or not there is archive data — it represents
  // timeless cocktail knowledge, not something that should be gated on usage.
  const qualifies = (anchor: Ingredient, c: Ingredient) =>
    learnedWith(anchor, c) ||
    styleWith(anchor, c) ||
    classicAffinity(anchor, c)

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

      // Extra spirits: prefer learned pairs, also accept style or classic affinity
      // matches — modifier spirits especially need a base spirit alongside them.
      const extraSpirits = spiritCandidates.filter(
        (s) =>
          s.id !== anchor.id &&
          (learnedWith(anchor, s) || styleWith(anchor, s) || classicAffinity(anchor, s)) &&
          underCap(s),
      )

      const bySlot: Combo["bySlot"] = {
        spirit: [anchor, ...extraSpirits.slice(0, SOFT_CAP.spirit - 1)],
      }
      const perCategory = new Map<string, number>()

      for (const c of otherPool) {
        if (!qualifies(anchor, c) || !underCap(c)) continue
        const cat = c.category as (typeof otherCategories)[number]
        const used = perCategory.get(cat) ?? 0
        if (used >= (SOFT_CAP[cat] ?? 1)) continue
        perCategory.set(cat, used + 1)
        bySlot[cat] = [...(bySlot[cat] ?? []), c]
      }

      // ── Rule 1: modifier spirits must always have a base spirit alongside them.
      // If every spirit in the combo is a modifier (limoncello, elderflower,
      // aperol, etc.), pull in the best-matching base spirit from stock.
      const currentSpirits = bySlot.spirit ?? []
      const hasBase = currentSpirits.some((s) => isBaseSpirit(s.name))
      if (!hasBase) {
        const pairedBase =
          // Prefer a base spirit that classically pairs with the anchor
          allBaseSpirits.find(
            (s) => !currentSpirits.some((cs) => cs.id === s.id) && classicAffinity(anchor, s) && underCap(s),
          ) ??
          // Fallback: any in-stock base spirit not already in the combo
          allBaseSpirits.find((s) => !currentSpirits.some((cs) => cs.id === s.id))
        if (pairedBase) bySlot.spirit = [...currentSpirits, pairedBase]
      }

      // ── Rule 2: every combo should have a spirit + acid + sweetener baseline.
      // These are the structural pillars of almost every cocktail. If the
      // flavor-tag filter produced no citrus or no sweetener, reach into all
      // in-stock ingredients (without the tag constraint) to fill the gap.
      if (!bySlot.citrus || bySlot.citrus.length === 0) {
        const anyCitrus = shuffled(allInStock.filter((i) => i.category === "citrus"))[0]
        if (anyCitrus) bySlot.citrus = [anyCitrus]
      }
      if (!bySlot.sweetener || bySlot.sweetener.length === 0) {
        const anySweetener = shuffled(allInStock.filter((i) => i.category === "sweetener"))[0]
        if (anySweetener) bySlot.sweetener = [anySweetener]
      }

      // Require at least spirit + one other ingredient (acid/sweet/mixer).
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

// Rough viability score — fraction of archive-proven ingredients, scaled
// into a percentage. Never claims full certainty, never reads as flat zero.
export function comboViability(combo: Combo, haveArchiveData: boolean): number {
  const allIds = Object.values(combo.bySlot).flat().map((i) => i.id)
  if (allIds.length === 0) return 0
  const provenFraction = combo.learnedIds.size / allIds.length
  const base = haveArchiveData ? 55 : 40
  const spread = haveArchiveData ? 40 : 25
  return Math.min(95, Math.round(base + provenFraction * spread))
}
