import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../context/DataContext"
import { buildPairingGraph, buildProvenGroups } from "../lib/learnedPairings"
import { checkRecipe } from "../lib/recipeCheck"
import { buildCombos, comboViability, shuffled, signatureOf, type Combo } from "../lib/comboGenerator"
import { inferOccasionTags } from "../lib/occasionThemes"
import SubstitutionManager from "../components/SubstitutionManager"
import FlaggedIngredients from "../components/FlaggedIngredients"
import FlavorNeuralPicker from "../components/FlavorNeuralPicker"
import RevealOnScroll from "../components/RevealOnScroll"
import StatusBadge from "../components/StatusBadge"
import FallingBottles from "../components/FallingBottles"
import ConfirmButton from "../components/ConfirmButton"
import ComboCard from "../components/ComboCard"
import bombayBottle from "../assets/bombay-bottle.webp"
import { FLAVOR_TAGS, type FlavorTag, type Ingredient } from "../types"

const THINKING_DELAY = () => 5000 + Math.random() * 5000

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm text-[var(--gold)]">
      <span className="thinking-pulse inline-block h-2 w-2 rounded-full bg-[var(--gold)]" />
      {label}
      <span className="thinking-dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </p>
  )
}

export default function ExperimentLabPage() {
  const { ingredients, experiments, recipes, substitutions, labQueue, removeFromLabQueue, locked } = useData()
  const navigate = useNavigate()
  const [selectedTags, setSelectedTags] = useState<FlavorTag[]>([])
  const [revealedTags, setRevealedTags] = useState<FlavorTag[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const thinkingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAllQueued, setShowAllQueued] = useState(false)
  const [showAllCombos, setShowAllCombos] = useState(false)
  // Bumped every time suggestions are (re)generated, even if the tag
  // selection ends up identical to last time — without this, picking the
  // exact same tags again always produced the exact same 30 combos in the
  // exact same order, since nothing else in the calculation ever changed.
  const [regenKey, setRegenKey] = useState(0)

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
    thinkingTimeout.current = setTimeout(() => {
      setRevealedTags(selectedTags)
      setRegenKey((k) => k + 1)
      setIsThinking(false)
      setShowAllCombos(false)
    }, THINKING_DELAY())

    return () => {
      if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags])

  const pairingGraph = useMemo(() => buildPairingGraph(experiments), [experiments])
  const provenGroups = useMemo(() => buildProvenGroups(experiments), [experiments])
  const haveArchiveData = pairingGraph.size > 0

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

  const combos = useMemo<Combo[]>(
    () => buildCombos(revealedTags, ingredients, pairingGraph, provenGroups, knownSignatures, 30),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ingredients, revealedTags, pairingGraph, provenGroups, knownSignatures, regenKey],
  )

  function tryCombo(combo: Combo, tags: string[]) {
    const ingredientIds = Object.values(combo.bySlot)
      .flat()
      .filter((i): i is Ingredient => Boolean(i))
      .map((i) => i.id)
    const params = new URLSearchParams({
      ingredients: ingredientIds.join(","),
      tags: tags.join(","),
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

  // --- "Plan For An Occasion" — same combo generator, tags inferred from a
  // typed-in theme via keyword lookup rather than picked by hand. ---
  const [occasionQuery, setOccasionQuery] = useState("")
  const [occasionThinking, setOccasionThinking] = useState(false)
  const occasionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [occasionResult, setOccasionResult] = useState<{
    label: string | null
    tags: FlavorTag[]
    reason: string
    combos: Combo[]
  } | null>(null)
  const [occasionShowAll, setOccasionShowAll] = useState(false)

  function handleOccasionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!occasionQuery.trim() || occasionThinking) return
    if (occasionTimeout.current) clearTimeout(occasionTimeout.current)
    setOccasionThinking(true)
    setOccasionResult(null)
    occasionTimeout.current = setTimeout(() => {
      const { label, tags, reason } = inferOccasionTags(occasionQuery)
      const occasionCombos = buildCombos(tags, ingredients, pairingGraph, provenGroups, knownSignatures, 15)
      setOccasionResult({ label, tags, reason, combos: occasionCombos })
      setOccasionThinking(false)
      setOccasionShowAll(false)
    }, THINKING_DELAY())
  }

  useEffect(() => {
    return () => {
      if (occasionTimeout.current) clearTimeout(occasionTimeout.current)
    }
  }, [])

  // --- Random Cocktail button — a fresh random tag set every press, with a
  // rough "how confident is this" percentage attached. ---
  const [randomThinking, setRandomThinking] = useState(false)
  const randomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [randomResult, setRandomResult] = useState<{ tags: FlavorTag[]; combo: Combo; viability: number } | null>(
    null,
  )
  const [randomEmpty, setRandomEmpty] = useState(false)

  function handleRandomCocktail() {
    if (randomThinking) return
    if (randomTimeout.current) clearTimeout(randomTimeout.current)
    setRandomThinking(true)
    setRandomResult(null)
    setRandomEmpty(false)
    randomTimeout.current = setTimeout(() => {
      // A few attempts with different random tag sets, since a single
      // unlucky combination (tags nothing in stock happens to carry) would
      // otherwise come up empty more often than it should.
      for (let attempt = 0; attempt < 6; attempt++) {
        const tagCount = 2 + Math.floor(Math.random() * 3) // 2–4 tags
        const tags = shuffled([...FLAVOR_TAGS]).slice(0, tagCount)
        const found = buildCombos(tags, ingredients, pairingGraph, provenGroups, knownSignatures, 5)
        if (found.length > 0) {
          const combo = found[0]
          setRandomResult({ tags, combo, viability: comboViability(combo, haveArchiveData) })
          setRandomThinking(false)
          return
        }
      }
      setRandomEmpty(true)
      setRandomThinking(false)
    }, THINKING_DELAY())
  }

  useEffect(() => {
    return () => {
      if (randomTimeout.current) clearTimeout(randomTimeout.current)
    }
  }, [])

  return (
    <div className="relative">
      <FallingBottles bottleImg={bombayBottle} />
      <RevealOnScroll>
        <h1 className="mb-1 text-lg font-medium">Build A Flavour Profile</h1>
        <p className="mb-4 text-sm text-[var(--cream-dim)]">
          Select flavour tags to get tight, deliberate combinations from your stocked ingredients.
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

      {isThinking && <ThinkingIndicator label="Thinking through combinations" />}

      <div className="space-y-3">
        {!isThinking &&
          combos.slice(0, showAllCombos ? undefined : 1).map((combo, i) => (
            <ComboCard key={i} combo={combo} tags={revealedTags} onTry={() => tryCombo(combo, revealedTags)} />
          ))}
        {!isThinking && revealedTags.length > 0 && combos.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">
            No new combinations available yet — either nothing in stock is tagged with these
            flavours, or every match already exists in your archive or a menu.
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

      <RevealOnScroll delay={150} className="mt-8 border-t border-[var(--cream-dim)]/15 pt-6">
        <h2 className="mb-1 text-base font-medium">Plan For An Occasion</h2>
        <p className="mb-3 text-sm text-[var(--cream-dim)]">
          Describe a holiday or event — Christmas, Easter, Valentine's Day, a World Cup watch
          party, a piano bar night, whatever — and this infers the flavour profile that fits and
          builds up to 15 suggestions from it, the same way the picker above does.
        </p>
        <form onSubmit={handleOccasionSubmit} className="mb-3 flex flex-wrap gap-2">
          <input
            className="h-9 flex-1 min-w-[200px] rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
            placeholder="e.g. Christmas, Valentine's Day, a footy grand final..."
            value={occasionQuery}
            onChange={(e) => setOccasionQuery(e.target.value)}
            disabled={occasionThinking}
          />
          <button
            type="submit"
            disabled={!occasionQuery.trim() || occasionThinking}
            className="h-9 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suggest cocktails
          </button>
        </form>

        {occasionThinking && <ThinkingIndicator label="Working out what fits the occasion" />}

        {!occasionThinking && occasionResult && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--cream-dim)]">
              {occasionResult.label ?? "That occasion"} calls for {occasionResult.reason} — leaning
              on{" "}
              {occasionResult.tags.map((t, i) => (
                <span key={t}>
                  {i > 0 ? ", " : ""}
                  <span className="text-[var(--gold)]">{t}</span>
                </span>
              ))}{" "}
              flavours.
            </p>
            {occasionResult.combos.slice(0, occasionShowAll ? undefined : 1).map((combo, i) => (
              <ComboCard
                key={i}
                combo={combo}
                tags={occasionResult.tags}
                onTry={() => tryCombo(combo, occasionResult.tags)}
              />
            ))}
            {occasionResult.combos.length === 0 && (
              <p className="text-sm text-[var(--cream-dim)]">
                Nothing in stock currently matches that occasion's profile, or every match already
                exists in your archive or a menu.
              </p>
            )}
            {!occasionShowAll && occasionResult.combos.length > 1 && (
              <button
                type="button"
                onClick={() => setOccasionShowAll(true)}
                className="text-xs text-[var(--teal)] hover:underline"
              >
                More ({occasionResult.combos.length - 1})
              </button>
            )}
          </div>
        )}
      </RevealOnScroll>

      <RevealOnScroll delay={200} className="mt-8 border-t border-[var(--cream-dim)]/15 pt-6">
        <h2 className="mb-1 text-base font-medium">Feeling Lucky?</h2>
        <p className="mb-3 text-sm text-[var(--cream-dim)]">
          Skip the tag picker entirely — this rolls a fresh random flavour combination every time
          you press it, with a rough confidence score for how proven the result is.
        </p>
        <button
          type="button"
          onClick={handleRandomCocktail}
          disabled={randomThinking}
          className="mb-3 h-9 rounded-md bg-[var(--teal)] px-4 text-sm font-medium text-[var(--on-teal)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🎲 Random Cocktail
        </button>

        {randomThinking && <ThinkingIndicator label="Rolling the dice" />}

        {!randomThinking && randomEmpty && (
          <p className="text-sm text-[var(--cream-dim)]">
            Couldn't land on a match after a few tries — your stock might be a bit thin right now.
            Give it another press.
          </p>
        )}

        {!randomThinking && randomResult && (
          <ComboCard
            combo={randomResult.combo}
            tags={randomResult.tags}
            badge={`${randomResult.viability}% match`}
            onTry={() => tryCombo(randomResult.combo, randomResult.tags)}
          />
        )}
      </RevealOnScroll>

      <RevealOnScroll delay={250} className="mt-8 border-t border-[var(--cream-dim)]/15 pt-6">
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
                    <ConfirmButton
                      disabled={locked}
                      onConfirm={() => removeFromLabQueue(item.id)}
                      label="Dismiss"
                      className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                      confirmClassName="text-xs font-medium text-[var(--berry)]"
                    />
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
