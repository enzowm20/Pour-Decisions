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
const BASE_SPIRIT_TOKENS = [
  "gin", "vodka", "tequila", "mezcal", "rum", "whiskey", "whisky", "bourbon",
  "scotch", "rye", "brandy", "cognac", "pisco", "cachaca", "cachaça",
  "sake", "shochu", "soju", "aquavit", "akvavit", "absinthe", "grappa",
  "calvados", "armagnac", "marc", "eau de vie",
]

function isBaseSpirit(name: string): boolean {
  const n = name.toLowerCase()
  return BASE_SPIRIT_TOKENS.some((t) => n.includes(t))
}

// ── Curdling risk ─────────────────────────────────────────────────────────────
// Citrus + dairy/coffee-cream = curdled disaster. If any ingredient carries
// these tokens, skip citrus for that combo entirely.
const CURDLING_TOKENS = [
  "espresso", "baileys", "irish cream", "cream liqueur", "cream vodka",
  "kahlúa", "kahlua", "tia maria", "coffee liqueur",
]

function hasCurdlingRisk(ingredients: Ingredient[]): boolean {
  return ingredients.some((i) => CURDLING_TOKENS.some((t) => i.name.toLowerCase().includes(t)))
}

// ── Top-up classification ─────────────────────────────────────────────────────
const SPARKLING_WINE_TOKENS = ["prosecco", "moscato", "champagne", "cava", "sparkling wine", "crémant", "cremant", "franciacorta"]
const CARBONATED_TOKENS     = ["soda", "tonic", "cola", "coke", "lemonade", "ginger beer", "ginger ale", "seltzer", "sparkling"]

function isSparklingWine(name: string): boolean {
  const n = name.toLowerCase()
  return SPARKLING_WINE_TOKENS.some((t) => n.includes(t))
}
function isCarbonated(name: string): boolean {
  const n = name.toLowerCase()
  return CARBONATED_TOKENS.some((t) => n.includes(t)) || isSparklingWine(n)
}

// ── Classic cocktail affinity ─────────────────────────────────────────────────
// Keys: name fragments of the "anchor" ingredient.
// Values: name fragments of ingredients that classically partner with it.
const CLASSIC_AFFINITY: Array<[string[], string[]]> = [
  [["gin"],                                          ["lemon", "lime", "tonic", "elderflower", "cucumber", "grapefruit", "rosemary", "basil", "lavender", "pink peppercorn"]],
  [["vodka"],                                        ["lemon", "lime", "cranberry", "elderflower", "ginger beer", "espresso", "peach", "pineapple", "passionfruit", "raspberry"]],
  [["tequila", "mezcal"],                            ["lime", "agave", "grapefruit", "orange", "triple sec", "cointreau", "jalapeño", "chili", "mango", "watermelon"]],
  [["rum"],                                          ["lime", "sugar", "mint", "pineapple", "mango", "coconut", "passionfruit", "ginger beer", "falernum"]],
  [["whiskey", "whisky", "bourbon", "scotch", "rye"],["lemon", "honey", "ginger", "orange", "bitters", "apple", "maple", "fig", "cherry"]],
  [["brandy", "cognac", "armagnac", "calvados"],     ["lemon", "orange", "triple sec", "apple", "peach", "honey", "raspberry"]],
  [["pisco"],                                        ["lime", "lemon", "egg white", "sugar", "bitters"]],
  [["limoncello"],                                   ["gin", "vodka", "lemon", "prosecco", "elderflower", "basil"]],
  [["elderflower", "st germain", "st-germain"],      ["gin", "vodka", "lemon", "lime", "cucumber", "prosecco", "grapefruit"]],
  [["aperol"],                                       ["prosecco", "soda", "orange", "gin", "grapefruit"]],
  [["campari"],                                      ["gin", "vermouth", "orange", "grapefruit", "rum"]],
  [["amaretto"],                                     ["bourbon", "lemon", "orange", "almond", "cherry"]],
  [["triple sec", "cointreau", "curacao"],           ["tequila", "gin", "vodka", "lime", "lemon", "orange", "cranberry"]],
  [["kahlúa", "kahlua", "coffee liqueur"],           ["vodka", "rum", "espresso", "cream", "chocolate"]],
  [["baileys", "irish cream"],                       ["vodka", "rum", "espresso", "chocolate", "cream"]],
  [["chambord", "raspberry liqueur"],                ["vodka", "gin", "lemon", "prosecco", "lime"]],
  [["peach schnapps"],                               ["vodka", "cranberry", "orange", "peach", "prosecco"]],
  [["passionfruit liqueur", "passoa"],               ["vodka", "rum", "lime", "passionfruit", "prosecco"]],
  [["lychee liqueur"],                               ["vodka", "gin", "lime", "rose", "elderflower"]],
  [["blue curacao"],                                 ["vodka", "rum", "lime", "orange", "pineapple"]],
]

function classicAffinity(a: Ingredient, b: Ingredient): boolean {
  const an = a.name.toLowerCase()
  const bn = b.name.toLowerCase()
  for (const [keys, partners] of CLASSIC_AFFINITY) {
    if (keys.some((k) => an.includes(k)) && partners.some((p) => bn.includes(p))) return true
    if (keys.some((k) => bn.includes(k)) && partners.some((p) => an.includes(p))) return true
  }
  return false
}

// ── Fruit alignment ───────────────────────────────────────────────────────────
// A fruit only belongs in a combo if it harmonises with at least one of the
// selected spirits. Orange next to Cointreau ✓. Raspberry with raspberry
// vodka ✓. Blueberries with pink gin ✓. Random orange with espresso vodka ✗.
const FRUIT_SPIRIT_AFFINITY: Array<[string[], string[]]> = [
  [["orange", "blood orange"],             ["cointreau", "triple sec", "curacao", "aperol", "campari", "brandy", "cognac", "amaretto", "bourbon", "rum"]],
  [["raspberry"],                          ["chambord", "raspberry vodka", "raspberry gin", "pink gin", "rose gin", "vodka", "gin", "lemon", "prosecco"]],
  [["blueberry"],                          ["pink gin", "elderflower", "gin", "vodka", "lemon", "lavender"]],
  [["strawberry"],                         ["prosecco", "elderflower", "gin", "vodka", "lemon", "champagne", "rum"]],
  [["lemon"],                              ["aperol", "limoncello", "gin", "elderflower", "vodka", "tequila", "rum", "honey"]],
  [["lime"],                               ["tequila", "mezcal", "rum", "vodka", "gin", "ginger beer", "coconut"]],
  [["grapefruit"],                         ["tequila", "mezcal", "gin", "campari", "aperol", "vodka"]],
  [["mango"],                              ["rum", "tequila", "lime", "chili", "coconut", "vodka", "passionfruit"]],
  [["pineapple"],                          ["rum", "coconut", "lime", "tequila", "vodka", "mezcal"]],
  [["passionfruit"],                       ["vodka", "rum", "lime", "prosecco", "passionfruit liqueur", "passoa"]],
  [["peach"],                              ["prosecco", "bourbon", "lemon", "brandy", "peach schnapps", "vodka"]],
  [["coconut"],                            ["rum", "lime", "pineapple", "mango", "tequila"]],
  [["watermelon"],                         ["tequila", "vodka", "lime", "mint", "mezcal"]],
  [["cherry"],                             ["bourbon", "brandy", "amaretto", "rum", "kirsch"]],
  [["apple"],                              ["bourbon", "calvados", "gin", "ginger", "lemon", "cinnamon"]],
  [["guava"],                              ["rum", "vodka", "lime", "tequila", "passionfruit"]],
  [["lychee"],                             ["vodka", "gin", "rose", "lime", "elderflower", "lychee liqueur"]],
  [["cucumber"],                           ["gin", "elderflower", "vodka", "lime", "mint"]],
  [["mint"],                               ["rum", "vodka", "gin", "lime", "sugar"]],
  [["cranberry"],                          ["vodka", "gin", "triple sec", "lime", "cointreau", "champagne"]],
]

function fruitAlignsWithSpirit(fruit: Ingredient, spirit: Ingredient): boolean {
  const fn = fruit.name.toLowerCase()
  const sn = spirit.name.toLowerCase()
  for (const [fruitKeys, spiritPartners] of FRUIT_SPIRIT_AFFINITY) {
    if (fruitKeys.some((k) => fn.includes(k)) && spiritPartners.some((p) => sn.includes(p))) return true
  }
  return false
}

// ── Caps ──────────────────────────────────────────────────────────────────────
const SOFT_CAP: Record<string, number> = {
  spirit:    3,  // anchor + up to 2 supporting spirits
  mixer:     1,  // one mixer keeps it focused
  citrus:    1,
  sweetener: 1,
  fruit:     1,
  other:     1,  // one top-up; second only allowed via sparkling-wine rule below
}

// Hard ceiling on total ingredients in any single combo.
const MAX_TOTAL_INGREDIENTS = 8

// Spirits get a tighter usage cap so the same gin doesn't headline every combo.
const MAX_SPIRIT_USES  = 1
const MAX_OTHER_USES   = 2

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

  const allInStock      = ingredients.filter((i) => i.inStock)
  const allBaseSpirits  = allInStock.filter((i) => i.category === "spirit" && isBaseSpirit(i.name))

  const otherCategories = ["mixer", "citrus", "sweetener", "fruit", "other"] as const
  // Base pool shuffled once per buildCombos call; re-shuffled per anchor below
  // for maximum variety across successive suggestions.
  const baseOtherPool = ingredients.filter((i) => i.category !== "spirit" && flavorMatch(i))

  const learnedWith = (a: Ingredient, b: Ingredient) => isLearnedPair(pairingGraph, a.id, b.id)
  const styleWith   = (a: Ingredient, b: Ingredient) => hasOverlap(a.styles ?? [], b.styles ?? [])
  const qualifies   = (anchor: Ingredient, c: Ingredient) =>
    learnedWith(anchor, c) || styleWith(anchor, c) || classicAffinity(anchor, c)

  const spiritUseCount = new Map<string, number>()
  const otherUseCount  = new Map<string, number>()
  const underCap = (ing: Ingredient) => {
    const count = ing.category === "spirit"
      ? (spiritUseCount.get(ing.id) ?? 0)
      : (otherUseCount.get(ing.id) ?? 0)
    const max = ing.category === "spirit" ? MAX_SPIRIT_USES : MAX_OTHER_USES
    return count < max
  }

  const seenSignatures = new Set<string>()
  const result: Combo[] = []

  let producedInLastRound = true
  while (result.length < maxCombos && producedInLastRound) {
    producedInLastRound = false

    for (const anchor of spiritCandidates) {
      if (result.length >= maxCombos) break
      if (!underCap(anchor)) continue

      // ── Single anchor spirit ──────────────────────────────────────────
      // If the anchor is a modifier (Disaronno, Aperol, limoncello…), add
      // exactly one base spirit that classically pairs with it. This gives
      // the combo a clear story: modifier adds personality, base spirit
      // carries the structure. Never add extra spirits beyond this pair.
      const bySlot: Combo["bySlot"] = { spirit: [anchor] }

      if (!isBaseSpirit(anchor.name)) {
        const pairedBase =
          allBaseSpirits.find((s) => classicAffinity(anchor, s) && underCap(s)) ??
          allBaseSpirits.find((s) => underCap(s))
        if (pairedBase) bySlot.spirit = [anchor, pairedBase]
      }

      // Re-shuffle the other-ingredient pool per anchor so repeated presses
      // always explore a different ordering.
      const otherPool = shuffled(baseOtherPool)
      const perCategory = new Map<string, number>()

      const totalSoFar = () => Object.values(bySlot).flat().length

      for (const c of otherPool) {
        // Hard total cap — stop filling once we hit 6 ingredients.
        if (totalSoFar() >= MAX_TOTAL_INGREDIENTS) break

        // Every non-spirit ingredient must qualify against the anchor spirit
        // specifically. This is the key coherence rule: if gin is the anchor,
        // only things that classically or provably pair with gin get in.
        if (!qualifies(anchor, c) || !underCap(c)) continue

        const cat    = c.category as (typeof otherCategories)[number]
        const used   = perCategory.get(cat) ?? 0
        const capFor = SOFT_CAP[cat] ?? 1

        // ── citrus: skip if any selected ingredient risks curdling ──
        if (cat === "citrus") {
          if (hasCurdlingRisk(Object.values(bySlot).flat())) continue
        }

        // ── sweetener: hard cap 1 ────────────────────────────────────
        if (cat === "sweetener" && used >= 1) continue

        // ── fruit: must align with anchor spirit ─────────────────────
        // Citrus fruits (lemon, lime, grapefruit) share the citrus slot —
        // if a citrus ingredient is already in the combo, skip them, and
        // if one of them was added first, block citrus category too.
        if (cat === "fruit") {
          if (!fruitAlignsWithSpirit(c, anchor)) continue
          if (used >= 1) continue
          const isCitrusFruit = ["lemon", "lime", "grapefruit"].some((k) => c.name.toLowerCase().includes(k))
          if (isCitrusFruit && (bySlot.citrus ?? []).length > 0) continue
        }

        if (cat === "citrus") {
          const citrusFruitPresent = (bySlot.fruit ?? []).some((f) =>
            ["lemon", "lime", "grapefruit"].some((k) => f.name.toLowerCase().includes(k))
          )
          if (citrusFruitPresent) continue
        }

        // ── top-ups: 1 by default; 2nd only if sparkling wine + mixer ─
        if (cat === "other") {
          const existing = bySlot.other ?? []
          if (existing.length >= 1) {
            const first = existing[0]
            const validPair =
              (isSparklingWine(first.name) && isCarbonated(c.name) && !isSparklingWine(c.name)) ||
              (isSparklingWine(c.name)     && isCarbonated(first.name) && !isSparklingWine(first.name))
            if (!validPair) continue
          }
          if (used >= 2) continue
        }

        if (!["citrus", "sweetener", "fruit", "other"].includes(cat)) {
          if (used >= capFor) continue
        }

        perCategory.set(cat, used + 1)
        bySlot[cat] = [...(bySlot[cat] ?? []), c]
      }

      // ── Structural baseline: citrus + sweetener if not already present ──
      // Only fill if we're under the total cap and no curdling risk.
      const allSelected = () => Object.values(bySlot).flat()
      if ((!bySlot.citrus || bySlot.citrus.length === 0) && !hasCurdlingRisk(allSelected()) && totalSoFar() < MAX_TOTAL_INGREDIENTS) {
        const fill = shuffled(allInStock.filter((i) => i.category === "citrus" && qualifies(anchor, i)))[0]
          ?? shuffled(allInStock.filter((i) => i.category === "citrus"))[0]
        if (fill) bySlot.citrus = [fill]
      }
      if ((!bySlot.sweetener || bySlot.sweetener.length === 0) && totalSoFar() < MAX_TOTAL_INGREDIENTS) {
        const fill = shuffled(allInStock.filter((i) => i.category === "sweetener" && qualifies(anchor, i)))[0]
          ?? shuffled(allInStock.filter((i) => i.category === "sweetener"))[0]
        if (fill) bySlot.sweetener = [fill]
      }

      if (Object.values(bySlot).flat().length < 2) continue

      const allIds    = Object.values(bySlot).flat().map((i) => i.id)
      const signature = signatureOf(allIds)
      if (seenSignatures.has(signature)) continue
      seenSignatures.add(signature)
      if (knownSignatures.has(signature)) continue

      for (const ing of Object.values(bySlot).flat()) {
        if (ing.category === "spirit") spiritUseCount.set(ing.id, (spiritUseCount.get(ing.id) ?? 0) + 1)
        else otherUseCount.set(ing.id, (otherUseCount.get(ing.id) ?? 0) + 1)
      }

      const learnedIds = provenMembersWithin(provenGroups, new Set(allIds))
      result.push({ bySlot, learnedIds })
      producedInLastRound = true
    }
  }

  return result
}

// ── Viability score ───────────────────────────────────────────────────────────
// A multi-factor estimate of how likely a combo is to actually work as a
// cocktail — not just "has this been tried before" but "does it make sense".
export function comboViability(combo: Combo, haveArchiveData: boolean): number {
  const allIngredients = Object.values(combo.bySlot).flat()
  if (allIngredients.length === 0) return 0

  const spirits   = combo.bySlot.spirit    ?? []
  const citrus    = combo.bySlot.citrus    ?? []
  const sweetener = combo.bySlot.sweetener ?? []
  const fruits    = combo.bySlot.fruit     ?? []

  let score = 30

  // Structural balance: spirit + acid + sweet = the foundation of almost
  // every great cocktail. Each pillar adds confidence.
  const hasSpirit   = spirits.length > 0
  const hasAcid     = citrus.length > 0
  const hasSweetener= sweetener.length > 0
  if (hasSpirit)                score += 10
  if (hasAcid && hasSweetener)  score += 20  // balanced sour/sweet
  else if (hasAcid || hasSweetener) score += 8

  // Base spirit anchoring: a combo built on a proper base spirit is more
  // likely to work than one leaning entirely on a modifier.
  if (spirits.some((s) => isBaseSpirit(s.name))) score += 8

  // Archive-proven pairings: the more of this combo has been confirmed to
  // work together in the archive, the higher the confidence.
  const provenFraction = allIngredients.length > 0
    ? combo.learnedIds.size / allIngredients.length
    : 0
  score += Math.round(provenFraction * (haveArchiveData ? 30 : 15))

  // Classic affinity hits: ingredients that are well-known cocktail partners.
  let affinityHits = 0
  for (const s of spirits) {
    for (const o of allIngredients) {
      if (o.id !== s.id && classicAffinity(s, o)) affinityHits++
    }
  }
  score += Math.min(15, affinityHits * 3)

  // Fruit alignment bonus: correctly-paired fruit suggests deliberate flavour
  // thinking rather than a random addition.
  if (fruits.length > 0) {
    const fruitAligned = fruits.every((f) => spirits.some((s) => fruitAlignsWithSpirit(f, s)))
    score += fruitAligned ? 5 : -5
  }

  // Penalty: citrus without sweetener (unbalanced sour)
  if (hasAcid && !hasSweetener) score -= 12

  // Penalty: modifier spirit with no base spirit
  if (hasSpirit && !spirits.some((s) => isBaseSpirit(s.name))) score -= 10

  return Math.min(95, Math.max(20, score))
}
