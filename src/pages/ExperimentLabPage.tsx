import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../context/DataContext"
import { buildPairingGraph, buildProvenGroups } from "../lib/learnedPairings"
import { checkRecipe } from "../lib/recipeCheck"
import { buildCombos, comboViability, shuffled, signatureOf, type Combo } from "../lib/comboGenerator"
import { inferOccasionTags, ALL_OCCASION_LABELS } from "../lib/occasionThemes"
import SubstitutionManager from "../components/SubstitutionManager"
import FlaggedIngredients from "../components/FlaggedIngredients"
import FlavorNeuralPicker from "../components/FlavorNeuralPicker"
import RevealOnScroll from "../components/RevealOnScroll"
import StatusBadge from "../components/StatusBadge"
import FallingBottles from "../components/FallingBottles"
import ConfirmButton from "../components/ConfirmButton"
import ComboCard from "../components/ComboCard"
import LuckyMartiniButton from "../components/LuckyMartiniButton"
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

  // Every combo signature already suggested ANYWHERE on this page this
  // session — the tag picker, the occasion planner, and the random button
  // all read from and add to this same set, so once a cocktail's been shown
  // once it's excluded from every future suggestion (any of the three) until
  // the pool genuinely runs dry, rather than just relying on shuffling to
  // probably not repeat.
  const seenSignaturesRef = useRef<Set<string>>(new Set())
  function excludeSeen() {
    return new Set([...knownSignatures, ...seenSignaturesRef.current])
  }
  function markSeen(shown: Combo[]) {
    for (const combo of shown) {
      const ids = Object.values(combo.bySlot).flat().map((i) => i.id)
      seenSignaturesRef.current.add(signatureOf(ids))
    }
  }

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
    () => buildCombos(revealedTags, ingredients, pairingGraph, provenGroups, excludeSeen(), 30),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ingredients, revealedTags, pairingGraph, provenGroups, knownSignatures, regenKey],
  )
  // Recorded after render (not inside the memo) so the exclusion set used by
  // the NEXT computation — here or in the occasion planner/random button —
  // reflects everything shown so far, without making the memo itself impure.
  useEffect(() => {
    markSeen(combos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combos])

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
  const [occasionPlaceholderIdx, setOccasionPlaceholderIdx] = useState(0)
  const [occasionPlaceholderVisible, setOccasionPlaceholderVisible] = useState(true)
  const [occasionInputFocused, setOccasionInputFocused] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      setOccasionPlaceholderVisible(false)
      setTimeout(() => {
        setOccasionPlaceholderIdx((i) => (i + 1) % ALL_OCCASION_LABELS.length)
        setOccasionPlaceholderVisible(true)
      }, 400)
    }, 2400)
    return () => clearInterval(id)
  }, [])
  const [occasionQuery, setOccasionQuery] = useState("")
  const [occasionThinking, setOccasionThinking] = useState(false)
  const occasionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [occasionResult, setOccasionResult] = useState<{
    label: string | null
    tags: FlavorTag[]
    reason: string
    combos: Combo[]
  } | null>(null)
  // How many of the (up to 5) occasion suggestions are currently shown —
  // starts at 1, and "Show more" reveals exactly one additional at a time
  // rather than dumping the rest in all at once.
  const [occasionVisibleCount, setOccasionVisibleCount] = useState(1)

  function handleOccasionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!occasionQuery.trim() || occasionThinking) return
    if (occasionTimeout.current) clearTimeout(occasionTimeout.current)
    setOccasionThinking(true)
    setOccasionResult(null)
    occasionTimeout.current = setTimeout(() => {
      const { label, tags, reason } = inferOccasionTags(occasionQuery)
      const occasionCombos = buildCombos(tags, ingredients, pairingGraph, provenGroups, excludeSeen(), 5)
      markSeen(occasionCombos)
      setOccasionResult({ label, tags, reason, combos: occasionCombos })
      setOccasionThinking(false)
      setOccasionVisibleCount(1)
    }, THINKING_DELAY())
  }

  // One sentence per suggestion explaining why THAT specific build fits —
  // led by its anchor spirit, framed against the occasion's overall reason.
  function occasionComboDescription(combo: Combo, reason: string, index: number): string {
    const spirit = combo.bySlot.spirit?.[0]
    const spirits = combo.bySlot.spirit ?? []
    const mixer = combo.bySlot.mixer?.[0]
    const citrus = combo.bySlot.citrus?.[0]
    const sweetener = combo.bySlot.sweetener?.[0]
    const fruit = combo.bySlot.fruit?.[0]
    const proven = combo.learnedIds.size > 0
    const provenSuffix = proven ? " — and a pairing you've already proven works together." : "."

    switch (index % 5) {
      case 0:
        // Spirit-led angle
        return spirit
          ? `${spirit.name}-led and built around ${reason}${provenSuffix}`
          : `Built around ${reason}${provenSuffix}`
      case 1:
        // Supporting ingredient angle
        if (mixer) return `The ${mixer.name} here does the heavy lifting — grounding this in ${reason}${provenSuffix}`
        if (citrus) return `A hit of ${citrus.name} is the key — it's what ties this build to ${reason}${provenSuffix}`
        return `The supporting cast here is what sells ${reason}${provenSuffix}`
      case 2:
        // Texture / character angle
        if (spirits.length > 1)
          return `A multi-spirit build that leans into the layered character of ${reason}${provenSuffix}`
        if (sweetener) return `${sweetener.name} softens the edges, giving this the approachable sweetness that suits ${reason}${provenSuffix}`
        return `A cleaner, more stripped-back take — still dialled in for ${reason}${provenSuffix}`
      case 3:
        // Crowd / setting angle
        if (fruit) return `${fruit.name} brings the colour and energy — exactly what you want when going for ${reason}${provenSuffix}`
        if (spirit) return `${spirit.name} carries the occasion well here — a reliable anchor for ${reason}${provenSuffix}`
        return `Crowd-friendly and well-suited to ${reason}${provenSuffix}`
      case 4:
        // Contrast / complexity angle
        if (citrus && sweetener)
          return `The push-pull of ${citrus.name} and ${sweetener.name} gives this one real depth — interesting enough for ${reason}${provenSuffix}`
        if (spirit) return `A more unexpected direction — ${spirit.name} isn't the obvious choice for ${reason}, but it works${provenSuffix}`
        return `A less obvious pick, but one that earns its place for ${reason}${provenSuffix}`
      default:
        return `Suited to ${reason}${provenSuffix}`
    }
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
        const found = buildCombos(tags, ingredients, pairingGraph, provenGroups, excludeSeen(), 5)
        if (found.length > 0) {
          const combo = found[0]
          markSeen([combo])
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
          builds up to 5 suggestions from it, the same way the picker above does.
        </p>
        <form onSubmit={handleOccasionSubmit} className="mb-3 flex flex-wrap gap-2">
          <div className="relative h-9 flex-1 min-w-[200px]">
            {!occasionQuery && !occasionInputFocused && (
              <span
                className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm select-none transition-all duration-300"
                style={{
                  color: "var(--cream-dim)",
                  opacity: occasionPlaceholderVisible ? 0.55 : 0,
                  filter: occasionPlaceholderVisible
                    ? "brightness(1)"
                    : "brightness(2) saturate(0)",
                }}
              >
                e.g. {ALL_OCCASION_LABELS[occasionPlaceholderIdx]}…
              </span>
            )}
            <input
              className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
              value={occasionQuery}
              onChange={(e) => setOccasionQuery(e.target.value)}
              onFocus={() => setOccasionInputFocused(true)}
              onBlur={() => setOccasionInputFocused(false)}
              disabled={occasionThinking}
            />
          </div>
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
            {occasionResult.combos.slice(0, occasionVisibleCount).map((combo, i) => (
              <ComboCard
                key={i}
                combo={combo}
                tags={occasionResult.tags}
                description={occasionComboDescription(combo, occasionResult.reason, i)}
                onTry={() => tryCombo(combo, occasionResult.tags)}
              />
            ))}
            {occasionResult.combos.length === 0 && (
              <p className="text-sm text-[var(--cream-dim)]">
                Nothing in stock currently matches that occasion's profile, or every match already
                exists in your archive or a menu.
              </p>
            )}
            {occasionVisibleCount < occasionResult.combos.length && (
              <button
                type="button"
                onClick={() => setOccasionVisibleCount((n) => n + 1)}
                className="text-xs text-[var(--teal)] hover:underline"
              >
                Show more ({occasionResult.combos.length - occasionVisibleCount} left)
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
        <div className="mb-4">
          <LuckyMartiniButton
            onClick={handleRandomCocktail}
            disabled={randomThinking}
            spinning={randomThinking}
          />
        </div>

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
