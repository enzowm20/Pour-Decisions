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
  const [showAllCombos, setShowAllCombos] = useState(false)

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
      setShowAllCombos(false)
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

    // Every in-stock, flavor-matching non-spirit, grouped by category.
    const otherCategories = ["mixer", "citrus", "sweetener", "fruit", "other"] as const
    const otherPool = byName(
      ingredients.filter((i) => i.category !== "spirit" && flavorMatch(i)),
    )

    // Do we have any archive data to lean on at all? If so, combos MUST be
    // built from proven pairings — that's what stops random suggestions. With
    // no archive yet, fall back to style compatibility so the page still
    // does something, but stays just as tight.
    const haveArchiveData = pairingGraph.size > 0
    const learnedWith = (anchor: Ingredient, c: Ingredient) => isLearnedPair(pairingGraph, anchor.id, c.id)
    const styleWith = (anchor: Ingredient, c: Ingredient) =>
      hasOverlap(anchor.styles ?? [], c.styles ?? [])
    // A candidate qualifies only if it's actually been proven alongside the
    // anchor in the archive (preferred), or — only when there's no archive
    // data at all — if it at least shares a cocktail style.
    const qualifies = (anchor: Ingredient, c: Ingredient) =>
      learnedWith(anchor, c) || (!haveArchiveData && styleWith(anchor, c))

    // Restraint: a real cocktail is a handful of ingredients, not a dozen.
    // Hard cap the whole build small, and never more than one of each
    // mixer/citrus/sweetener/fruit/top-up, at most two spirits.
    const MAX_TOTAL = 4
    const MAX_COMBOS = 8
    const seenSignatures = new Set<string>()
    const result: Combo[] = []

    for (const anchor of spiritCandidates) {
      if (result.length >= MAX_COMBOS) break

      // Candidates that pair with the anchor, learned ones first so the
      // build is anchored in what's actually worked before.
      const partners = otherPool
        .filter((c) => qualifies(anchor, c))
        .sort((a, b) => Number(learnedWith(anchor, b)) - Number(learnedWith(anchor, a)))

      // A second spirit only if it's been proven with the anchor — keeps
      // multi-spirit builds deliberate rather than scattershot.
      const secondSpirit = spiritCandidates.find((s) => s.id !== anchor.id && learnedWith(anchor, s))

      const bySlot: Combo["bySlot"] = { spirit: [anchor] }
      let total = 1
      const usedCategories = new Set<string>()

      if (secondSpirit && total < MAX_TOTAL) {
        bySlot.spirit = [anchor, secondSpirit]
        total++
      }

      for (const c of partners) {
        if (total >= MAX_TOTAL) break
        if (usedCategories.has(c.category)) continue // one per non-spirit category
        usedCategories.add(c.category)
        bySlot[c.category as (typeof otherCategories)[number]] = [c]
        total++
      }

      // A lone spirit isn't a suggestion worth showing.
      if (total < 2) continue

      const allIds = Object.values(bySlot).flat().map((i) => i.id)
      const signature = signatureOf(allIds)
      if (seenSignatures.has(signature)) continue
      seenSignatures.add(signature)

      // Skip anything that already exists as an experiment or menu item —
      // these are meant to be new.
      if (knownSignatures.has(signature)) continue

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
          Select flavor tags to get tight, deliberate combinations from your stocked ingredients.
          Suggestions are built around pairings you've actually logged as "worked" in the archive —
          so the more you log, the sharper these get — and are kept small (a spirit plus a few
          partners), never a scattershot pile of ingredients. Anything that already matches an
          existing experiment or menu item is skipped, so these stay genuinely new.
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
        {!isThinking && combos.slice(0, showAllCombos ? undefined : 1).map((combo, i) => {
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
        {!isThinking && !showAllCombos && combos.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAllCombos(true)}
            className="text-xs text-[var(--teal)] hover:underline"
          >
            More ({combos.length - 1})
          </button>
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
