import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { buildPairingGraph, buildProvenGroups, isLearnedPair, provenMembersWithin } from "../lib/learnedPairings"
import { checkRecipe } from "../lib/recipeCheck"
import SubstitutionManager from "../components/SubstitutionManager"
import FlaggedIngredients from "../components/FlaggedIngredients"
import FlavorNeuralPicker from "../components/FlavorNeuralPicker"
import RevealOnScroll from "../components/RevealOnScroll"
import StatusBadge from "../components/StatusBadge"
import FallingBottles from "../components/FallingBottles"
import bombayBottle from "../assets/bombay-bottle.webp"
import { type FlavorTag, type Ingredient, type IngredientCategory } from "../types"

const CAPS: Record<IngredientCategory, number> = {
  spirit: 4,
  mixer: 4,
  citrus: 1,
  sweetener: 2,
  fruit: 2,
  other: 1,
}

const LABELS: Record<IngredientCategory, string> = {
  spirit: "Spirits",
  mixer: "Mixers",
  citrus: "Citrus",
  sweetener: "Sweeteners",
  fruit: "Fruit",
  other: "Top-up",
}

// Render order for whichever categories happen to be present in a combo.
const DISPLAY_ORDER: IngredientCategory[] = ["spirit", "mixer", "citrus", "sweetener", "fruit", "other"]

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
  const { ingredients, experiments, recipes, substitutions, labQueue, removeFromLabQueue } = useData()
  const navigate = useNavigate()
  const [selectedTags, setSelectedTags] = useState<FlavorTag[]>([])
  const [revealedTags, setRevealedTags] = useState<FlavorTag[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const thinkingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAllQueued, setShowAllQueued] = useState(false)

  // Gimmick: don't reveal suggestions the instant a tag is picked — let the
  // neural picker "think" for a random 5-10s stretch first, like it's
  // actually working the combination out rather than just filtering a list.
  useEffect(() => {
    if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)

    if (selectedTags.length === 0) {
      setIsThinking(false)
      setRevealedTags([])
      return
    }

    setIsThinking(true)
    const delay = 5000 + Math.random() * 5000
    thinkingTimeout.current = setTimeout(() => {
      setRevealedTags(selectedTags)
      setIsThinking(false)
    }, delay)

    return () => {
      if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags])

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

  // Recipes sent over from a venue scan, waiting here under their own
  // heading rather than having jumped the user straight to this page.
  const queuedResults = labQueue.map((item) => ({
    item,
    result: checkRecipe(
      { id: item.id, name: item.name, venueId: null, scanId: null, ingredientIds: item.ingredientIds },
      ingredients,
      substitutions,
    ),
  }))

  function toggleTag(tag: FlavorTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const combos = useMemo<Combo[]>(() => {
    if (revealedTags.length === 0) return []

    const flavorMatch = (i: Ingredient) => i.inStock && i.tags.some((t) => revealedTags.includes(t))

    const spiritCandidates = byName(
      ingredients.filter((i) => i.category === "spirit" && flavorMatch(i)),
    )
    if (spiritCandidates.length === 0) return []

    const otherCategoryPools: Record<string, Ingredient[]> = {
      mixer: byName(ingredients.filter((i) => i.category === "mixer" && flavorMatch(i))),
      citrus: byName(ingredients.filter((i) => i.category === "citrus" && flavorMatch(i))),
      sweetener: byName(ingredients.filter((i) => i.category === "sweetener" && flavorMatch(i))),
      fruit: byName(ingredients.filter((i) => i.category === "fruit" && flavorMatch(i))),
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

      for (const category of ["mixer", "citrus", "sweetener", "fruit", "other"] as const) {
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
  }, [ingredients, revealedTags, pairingGraph, provenGroups, knownSignatures])

  function tryCombo(combo: Combo) {
    const ingredientIds = Object.values(combo.bySlot)
      .flat()
      .filter((i): i is Ingredient => Boolean(i))
      .map((i) => i.id)
    const params = new URLSearchParams({
      ingredients: ingredientIds.join(","),
      tags: revealedTags.join(","),
    })
    navigate(`/archive?${params.toString()}`)
  }

  function tryQueued(item: { name: string; ingredientIds: string[] }) {
    const params = new URLSearchParams({
      name: item.name,
      ingredients: item.ingredientIds.join(","),
    })
    navigate(`/archive?${params.toString()}`)
  }

  return (
    <div className="relative">
      <FallingBottles bottleImg={bombayBottle} />
      <RevealOnScroll>
        <h1 className="mb-1 text-lg font-medium">Build A Flavor Profile</h1>
        <p className="mb-4 text-sm text-[var(--cream-dim)]">
          Select flavor tags to get combinations from your stocked ingredients. Ingredients combine
          if they share a flavor tag and either a cocktail style or a pairing you've already logged
          as "worked" in the archive. Anything that already matches an existing experiment or menu
          item is skipped — these are meant to be genuinely new, not a recipe you already have on
          file.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={100}>
        <FlavorNeuralPicker selectedTags={selectedTags} onToggle={toggleTag} />
      </RevealOnScroll>

      {selectedTags.length === 0 && (
        <p className="text-sm text-[var(--cream-dim)]">Select at least one tag to see suggestions.</p>
      )}

      {isThinking && (
        <p className="mb-3 flex items-center gap-2 text-sm text-[var(--gold)]">
          <span className="thinking-pulse inline-block h-2 w-2 rounded-full bg-[var(--gold)]" />
          Thinking through combinations
          <span className="thinking-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      )}

      <div className="space-y-3">
        {!isThinking && combos.map((combo, i) => {
          const presentCategories = DISPLAY_ORDER.filter((c) => (combo.bySlot[c] ?? []).length > 0)
          return (
            <RevealOnScroll
              key={i}
              className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4"
            >
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
                  {revealedTags.map((tag) => (
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
            </RevealOnScroll>
          )
        })}
        {!isThinking && revealedTags.length > 0 && combos.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">
            No new combinations available yet — either nothing in stock is tagged with these
            flavors, or every match already exists in your archive or a menu.
          </p>
        )}
      </div>

      <RevealOnScroll className="mt-8 border-t border-[var(--cream-dim)]/15 pt-6">
        <SubstitutionManager />

        {queuedResults.length > 0 && (
          <div className="mt-6">
            <p className="mb-1 text-sm font-medium">Venue Scan Cocktails ({queuedResults.length})</p>
            <p className="mb-3 text-xs text-[var(--cream-dim)]">
              Recipes you sent over from a venue scan, waiting here for you to review whenever you
              get to it.
            </p>
            <div className="space-y-3">
              {queuedResults.slice(0, showAllQueued ? undefined : 1).map(({ item, result }) => (
                <RevealOnScroll
                  key={item.id}
                  className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <StatusBadge status={result.status} />
                  </div>
                  <p className="mb-2 text-xs text-[var(--cream-dim)]">
                    {result.items.map((i, idx) => (
                      <span key={idx}>
                        {idx > 0 ? ", " : ""}
                        {i.status === "have" ? (
                          i.ingredient.name
                        ) : (
                          <span className="text-[var(--cream-dim)] line-through">{i.ingredient.name}</span>
                        )}
                      </span>
                    ))}
                  </p>
                  {result.items.some((i) => i.status === "substitute") && (
                    <p className="mb-2 text-xs text-[var(--cream-dim)]">
                      {result.items
                        .filter((i) => i.status === "substitute")
                        .map((i) => `We have ${i.substitute?.name} — use it in place of ${i.ingredient.name}`)
                        .join(". ")}
                      . Add more swaps below if something else is missing.
                    </p>
                  )}
                  {result.toPurchase.length > 0 && (
                    <p className="mb-2 text-xs text-[var(--cream-dim)]">
                      No substitute on file for {result.toPurchase.map((i) => i.name).join(", ")} —
                      add one below, or buy it to make this as written.
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => tryQueued(item)}
                      className="h-8 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90"
                    >
                      Try this
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromLabQueue(item.id)}
                      className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                    >
                      Dismiss
                    </button>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
            {!showAllQueued && queuedResults.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllQueued(true)}
                className="mt-2 text-xs text-[var(--teal)] hover:underline"
              >
                More ({queuedResults.length - 1})
              </button>
            )}
          </div>
        )}

        <FlaggedIngredients />
      </RevealOnScroll>
    </div>
  )
}
