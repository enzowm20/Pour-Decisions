import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import { checkRecipe } from "../lib/recipeCheck"
import { fileToCompressedImage } from "../lib/storage"
import { byName } from "../lib/sort"
import { extractTextFromFile } from "../lib/textExtraction"
import { parseMenuText } from "../lib/menuParser"
import { findFuzzyMatch } from "../lib/fuzzyMatch"
import IngredientPicker from "../components/IngredientPicker"
import StatusBadge from "../components/StatusBadge"
import RevealOnScroll from "../components/RevealOnScroll"
import FallingBottles from "../components/FallingBottles"
import ConfirmButton from "../components/ConfirmButton"
import chambordBottle from "../assets/chambord-bottle.webp"
import type { Ingredient } from "../types"

interface ReviewIngredient {
  raw: string
  resolvedId?: string // confirmed match — either exact, or a fuzzy suggestion the user accepted
  fuzzyId?: string // a pending "did you mean...?" suggestion awaiting yes/no
  fuzzyName?: string
  rejected?: boolean // user said "no" to the fuzzy suggestion — stays unmatched
}

interface ReviewRecipe {
  name: string
  include: boolean
  ingredients: ReviewIngredient[]
}

function buildReviewIngredient(raw: string, ingredients: Ingredient[]): ReviewIngredient {
  const exact = ingredients.find((i) => i.name.toLowerCase() === raw.toLowerCase())
  if (exact) return { raw, resolvedId: exact.id }

  const fuzzy = findFuzzyMatch(raw, ingredients)
  if (fuzzy) return { raw, fuzzyId: fuzzy.id, fuzzyName: fuzzy.name }

  return { raw }
}

export default function VenueDetailPage() {
  const { venueId: routeVenueId } = useParams()
  const {
    venues,
    scans,
    addScan,
    updateScan,
    removeScan,
    recipes,
    addRecipe,
    updateRecipe,
    removeRecipe,
    ingredients,
    substitutions,
    addToLabQueue,
    locked,
  } = useData()

  const venue = venues.find((v) => v.id === routeVenueId)

  const [activeScanId, setActiveScanId] = useState<string | null>(null)
  const [recipeName, setRecipeName] = useState("")
  const [recipeIngredientIds, setRecipeIngredientIds] = useState<string[]>([])

  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIngredientIds, setEditIngredientIds] = useState<string[]>([])

  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState("")
  const [rawText, setRawText] = useState<string | null>(null)
  const [reviewRecipes, setReviewRecipes] = useState<ReviewRecipe[] | null>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [manualIngredientDrafts, setManualIngredientDrafts] = useState<Record<number, string>>({})
  const [saveStatus, setSaveStatus] = useState("")
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

  if (!venue) {
    return <p className="text-sm text-[var(--cream-dim)]">Venue not found.</p>
  }

  const venueScans = scans
    .filter((s) => s.venueId === venue.id)
    .sort((a, b) => b.photoDate.localeCompare(a.photoDate))

  const venueId = venue.id

  const handleAddRecipe = (scanId: string) => {
    if (!recipeName.trim() || recipeIngredientIds.length === 0) return
    addRecipe({
      name: recipeName.trim(),
      venueId,
      scanId,
      ingredientIds: recipeIngredientIds,
    })
    setRecipeName("")
    setRecipeIngredientIds([])
  }

  function startEditRecipe(recipe: { id: string; name: string; ingredientIds: string[] }) {
    setEditingRecipeId(recipe.id)
    setEditName(recipe.name)
    setEditIngredientIds(recipe.ingredientIds)
  }

  function saveEditRecipe() {
    if (!editingRecipeId || !editName.trim()) return
    const byId = new Map(ingredients.map((i) => [i.id, i]))
    const sorted = [...editIngredientIds].sort((a, b) =>
      (byId.get(a)?.name ?? "").localeCompare(byId.get(b)?.name ?? ""),
    )
    updateRecipe(editingRecipeId, { name: editName.trim(), ingredientIds: sorted })
    setEditingRecipeId(null)
  }

  const handleSendToLab = (recipe: { name: string; ingredientIds: string[] }) => {
    addToLabQueue({ name: recipe.name, ingredientIds: recipe.ingredientIds })
    setSaveStatus(`"${recipe.name}" sent to the Experiment Lab queue.`)
  }

  const handleLogManually = () => {
    setPendingPhoto(null)
    setReviewRecipes(null)
    setSaveStatus("")
    setParseError("")
    setRawText("")
  }

  const handleMenuFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setIsProcessing(true)
    setParseError("")
    setRawText(null)
    setReviewRecipes(null)
    setSaveStatus("")

    try {
      const [text, photoDataUrl] = await Promise.all([
        extractTextFromFile(file),
        file.type.startsWith("image/") ? fileToCompressedImage(file) : Promise.resolve(null),
      ])
      setPendingPhoto(photoDataUrl)
      setRawText(text)
      if (text.trim().length === 0) {
        setParseError(
          "No text came out of that file at all. If it's a scanned PDF with no real text layer, try uploading it as an image instead.",
        )
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Couldn't read that file.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Re-runnable on demand — lets you fix OCR mistakes (a misread word, "lemon
  // and ginger" run together as one ingredient instead of two, etc.) in the
  // raw text and re-parse as many times as you like before committing to a
  // recipe list.
  function handleParseRawText() {
    if (rawText === null) return
    const parsed = parseMenuText(rawText)
    setReviewRecipes(
      parsed.map((r) => ({
        name: r.name,
        include: true,
        ingredients: r.ingredientNames.map((n) => buildReviewIngredient(n, ingredients)),
      })),
    )
    if (parsed.length === 0) {
      setParseError(
        "Couldn't find anything that looked like a recipe in that text. Try splitting names and ingredient lines onto their own lines below.",
      )
    } else {
      setParseError("")
    }
  }

  function updateReviewRecipe(index: number, patch: Partial<ReviewRecipe>) {
    setReviewRecipes((prev) => prev?.map((r, i) => (i === index ? { ...r, ...patch } : r)) ?? null)
  }

  function resolveFuzzy(recipeIndex: number, ingredientIndex: number, accept: boolean) {
    setReviewRecipes((prev) => {
      if (!prev) return null
      return prev.map((r, ri) => {
        if (ri !== recipeIndex) return r
        return {
          ...r,
          ingredients: r.ingredients.map((ing, ii) => {
            if (ii !== ingredientIndex) return ing
            if (accept) return { raw: ing.raw, resolvedId: ing.fuzzyId }
            return { raw: ing.raw, rejected: true }
          }),
        }
      })
    })
  }

  function resolveManually(recipeIndex: number, ingredientIndex: number, stockId: string) {
    setReviewRecipes((prev) => {
      if (!prev) return null
      return prev.map((r, ri) => {
        if (ri !== recipeIndex) return r
        return {
          ...r,
          ingredients: r.ingredients.map((ing, ii) =>
            ii === ingredientIndex ? { raw: ing.raw, resolvedId: stockId } : ing,
          ),
        }
      })
    })
  }

  function removeReviewIngredient(recipeIndex: number, ingredientIndex: number) {
    setReviewRecipes((prev) => {
      if (!prev) return null
      return prev.map((r, ri) =>
        ri === recipeIndex ? { ...r, ingredients: r.ingredients.filter((_, ii) => ii !== ingredientIndex) } : r,
      )
    })
  }

  function addManualIngredient(recipeIndex: number) {
    const raw = (manualIngredientDrafts[recipeIndex] ?? "").trim()
    if (!raw) return
    setReviewRecipes((prev) => {
      if (!prev) return null
      return prev.map((r, ri) =>
        ri === recipeIndex
          ? { ...r, ingredients: [...r.ingredients, buildReviewIngredient(raw, ingredients)] }
          : r,
      )
    })
    setManualIngredientDrafts((prev) => ({ ...prev, [recipeIndex]: "" }))
  }

  const hasPendingFuzzy =
    reviewRecipes?.some(
      (r) => r.include && r.ingredients.some((ing) => ing.fuzzyId && !ing.resolvedId && !ing.rejected),
    ) ?? false

  function handleSaveReviewed() {
    if (!reviewRecipes || hasPendingFuzzy) return
    const included = reviewRecipes.filter((r) => r.include && r.name.trim())
    if (included.length === 0) return

    const today = new Date().toISOString().slice(0, 10)
    const scan = addScan({
      venueId,
      date: today,
      photoDate,
      photos: pendingPhoto ? [pendingPhoto] : [],
    })

    const byId = new Map(ingredients.map((i) => [i.id, i]))

    for (const r of included) {
      const ingredientIds: string[] = []
      const missingIngredientNames: string[] = []
      for (const ing of r.ingredients) {
        if (ing.resolvedId) ingredientIds.push(ing.resolvedId)
        else missingIngredientNames.push(ing.raw)
      }
      // Alphabetical rather than save order, so the recipe reads the same
      // regardless of which ingredient line happened to get confirmed first.
      ingredientIds.sort((a, b) => (byId.get(a)?.name ?? "").localeCompare(byId.get(b)?.name ?? ""))
      missingIngredientNames.sort((a, b) => a.localeCompare(b))
      addRecipe({
        name: r.name.trim(),
        venueId,
        scanId: scan.id,
        ingredientIds,
        missingIngredientNames: missingIngredientNames.length > 0 ? missingIngredientNames : undefined,
      })
    }

    setSaveStatus(`Saved ${included.length} recipe${included.length === 1 ? "" : "s"} to a new scan.`)
    setReviewRecipes(null)
    setPendingPhoto(null)
  }

  // Aggregate purchase list across all scans
  const allVenueRecipes = recipes.filter((r) => r.venueId === venue.id)
  const purchaseMap = new Map<string, number>()
  for (const recipe of allVenueRecipes) {
    const result = checkRecipe(recipe, ingredients, substitutions)
    for (const ing of result.toPurchase) {
      purchaseMap.set(ing.name, (purchaseMap.get(ing.name) ?? 0) + 1)
    }
  }

  return (
    <div className="relative space-y-6">
      <FallingBottles bottleImg={chambordBottle} />
      <RevealOnScroll>
        <Link to="/venues" className="text-xs text-[var(--cream-dim)] hover:underline">
          ← Venue scans
        </Link>
        <h1 className="mt-1 text-lg font-medium">{venue.name}</h1>
      </RevealOnScroll>

      {purchaseMap.size > 0 && (
        <div className="rounded-md bg-[var(--gold)]/15 px-3 py-2 text-sm text-[var(--gold)]">
          Shopping list to make everything from this venue:{" "}
          {Array.from(purchaseMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, count]) => `${name} (used in ${count})`)
            .join(", ")}
        </div>
      )}

      <RevealOnScroll
        delay={80}
        className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4"
      >
        <p className="mb-1 text-sm font-medium">Import Menu From A Photo Or PDF</p>
        <p className="mb-3 text-xs text-[var(--cream-dim)]">
          Upload a photo of {venue.name}'s menu, or a PDF, and this reads the text and proposes
          recipes for you to review below before saving. Runs entirely in your browser — no
          ingredients are created automatically. An exact stock match is used right away; a close
          match (like "Aperol" against your "Aperol Aperitivo") is suggested for you to confirm,
          not assumed silently. Anything left unmatched is saved by name and flagged on the
          Experiment Lab page.
        </p>

        {/* Covers the whole import/manual-log/review workflow below — every
            control in here either uploads, parses, or saves data. */}
        <fieldset disabled={locked} className="contents">
        <div className="mb-3 flex items-center gap-2">
          <label className="text-xs text-[var(--cream-dim)]">Date the photo was taken</label>
          <input
            type="date"
            className="h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
          />
        </div>

        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleMenuFileSelected}
          disabled={isProcessing || locked}
          className="text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isProcessing && <p className="mt-2 text-xs text-[var(--cream-dim)]">Reading file…</p>}
        {pendingPhoto && (
          <button
            type="button"
            onClick={() => setEnlargedPhoto(pendingPhoto)}
            className="mt-2 h-20 w-20 overflow-hidden rounded-md"
          >
            <img src={pendingPhoto} alt="" className="h-full w-full object-cover transition hover:opacity-80" />
          </button>
        )}
        {parseError && <p className="mt-2 text-xs text-[var(--berry)]">{parseError}</p>}
        {saveStatus && <p className="mt-2 text-xs text-[var(--sage)]">{saveStatus}</p>}

        <button
          type="button"
          onClick={handleLogManually}
          className="mt-3 text-xs text-[var(--teal)] hover:underline"
        >
          Or log cocktail menu manually
        </button>

        {rawText !== null && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--cream-dim)]">
              {rawText === "" && !pendingPhoto
                ? "Type out the cocktail menu below, one ingredient per line within each recipe, then parse it into recipes."
                : "Raw text read from the file — fix anything misread before parsing it into recipes. For example, if a line reads \"lemon and ginger\" as one ingredient when it should be two, split it onto two lines (or add a comma between them)."}
            </p>
            <textarea
              className="h-40 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] p-2 text-xs text-[var(--cream)]"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button
              type="button"
              onClick={handleParseRawText}
              className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
            >
              Parse this text into recipes
            </button>
          </div>
        )}

        {reviewRecipes && reviewRecipes.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--cream-dim)]">
              Review what was found — confirm or reject suggested matches, edit names, untick
              anything wrong, then save.
            </p>
            {reviewRecipes.map((r, ri) => (
              <div key={ri} className="rounded-md border border-[var(--cream-dim)]/15 p-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => updateReviewRecipe(ri, { include: e.target.checked })}
                    className="mt-2"
                  />
                  <input
                    className="h-8 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)]"
                    value={r.name}
                    onChange={(e) => updateReviewRecipe(ri, { name: e.target.value })}
                  />
                </div>

                <div className="mt-2 space-y-1 pl-6">
                  {r.ingredients.map((ing, ii) => (
                    <div key={ii} className="flex flex-wrap items-center gap-2 text-xs">
                      {ing.resolvedId ? (
                        <span className="text-[var(--sage)]">✓ {ing.raw}</span>
                      ) : ing.fuzzyId && !ing.rejected ? (
                        <>
                          <span className="text-[var(--cream-dim)]">{ing.raw} — did you mean</span>
                          <span className="font-medium">{ing.fuzzyName}</span>
                          <span className="text-[var(--cream-dim)]">?</span>
                          <button
                            type="button"
                            onClick={() => resolveFuzzy(ri, ii, true)}
                            className="rounded-md bg-[var(--sage)] px-2 py-0.5 text-[var(--on-sage)]"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveFuzzy(ri, ii, false)}
                            className="rounded-md bg-[var(--berry)] px-2 py-0.5 text-[var(--on-berry)]"
                          >
                            No
                          </button>
                        </>
                      ) : ing.rejected ? (
                        <>
                          <span className="italic text-[var(--cream-dim)]">{ing.raw} —</span>
                          <select
                            className="h-7 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-1.5 text-xs text-[var(--cream)]"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) resolveManually(ri, ii, e.target.value)
                            }}
                          >
                            <option value="">Select from stock...</option>
                            {byName(ingredients).map((stockIng) => (
                              <option key={stockIng.id} value={stockIng.id}>
                                {stockIng.name}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <span className="italic text-[var(--cream-dim)]">{ing.raw} (not in stock)</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeReviewIngredient(ri, ii)}
                        className="text-[var(--cream-dim)] hover:text-[var(--berry)]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 pt-1">
                    <input
                      className="h-7 w-40 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)]"
                      placeholder="Add ingredient..."
                      value={manualIngredientDrafts[ri] ?? ""}
                      onChange={(e) =>
                        setManualIngredientDrafts((prev) => ({ ...prev, [ri]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addManualIngredient(ri)}
                      className="text-xs text-[var(--teal)] hover:underline"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hasPendingFuzzy && (
              <p className="text-xs text-[var(--gold)]">
                Answer the "did you mean" prompts above before saving.
              </p>
            )}
            <button
              type="button"
              onClick={handleSaveReviewed}
              disabled={hasPendingFuzzy}
              className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              Save reviewed recipes
            </button>
          </div>
        )}
        </fieldset>
      </RevealOnScroll>

      <section className="space-y-4">
        {venueScans.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">No scans yet for this venue.</p>
        )}
        {venueScans.map((scan, scanI) => {
          const scanRecipes = byName(recipes.filter((r) => r.scanId === scan.id))
          const isActive = activeScanId === scan.id
          return (
            <RevealOnScroll
              key={scan.id}
              delay={Math.min(scanI, 8) * 60}
              className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4"
            >
              <fieldset disabled={locked} className="contents">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-[var(--cream-dim)]">Photo taken</label>
                    <input
                      type="date"
                      className="h-8 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
                      value={scan.photoDate}
                      onChange={(e) => updateScan(scan.id, { photoDate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-[var(--cream-dim)]">Logged</label>
                    <input
                      type="date"
                      className="h-8 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
                      value={scan.date}
                      onChange={(e) => updateScan(scan.id, { date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveScanId(isActive ? null : scan.id)}
                    className="text-xs text-[var(--teal)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isActive ? "Done adding" : "Add cocktail"}
                  </button>
                  <ConfirmButton
                    disabled={locked}
                    onConfirm={() => removeScan(scan.id)}
                    label="Remove scan"
                    className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                    confirmClassName="text-xs font-medium text-[var(--berry)]"
                  />
                </div>
              </div>
              </fieldset>

              {scan.photos.length > 0 && (
                <div className="mb-3 flex gap-2">
                  {scan.photos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEnlargedPhoto(p)}
                      className="h-20 w-20 overflow-hidden rounded-md"
                    >
                      <img src={p} alt="" className="h-full w-full object-cover transition hover:opacity-80" />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {scanRecipes.map((recipe) => {
                  const result = checkRecipe(recipe, ingredients, substitutions)
                  const missingNames = recipe.missingIngredientNames ?? []
                  const isEditing = editingRecipeId === recipe.id
                  return (
                    <div key={recipe.id} className="rounded-md border border-[var(--cream-dim)]/15 p-3">
                      <fieldset disabled={locked} className="contents">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <IngredientPicker
                            ingredients={ingredients}
                            selectedIds={editIngredientIds}
                            onChange={setEditIngredientIds}
                          />
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={saveEditRecipe}
                              disabled={!editName.trim()}
                              className="h-8 rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRecipeId(null)}
                              className="text-xs text-[var(--cream-dim)] hover:text-[var(--cream)]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{recipe.name}</p>
                              <p className="text-xs text-[var(--cream-dim)]">
                                {result.items.map((item, i) => (
                                  <span key={i}>
                                    {i > 0 ? ", " : ""}
                                    {item.status === "missing" ? (
                                      <span className="text-[var(--cream-dim)] line-through">
                                        {item.ingredient.name}
                                      </span>
                                    ) : item.status === "substitute" ? (
                                      <span className="text-[var(--cream-dim)] line-through">
                                        {item.ingredient.name}
                                      </span>
                                    ) : (
                                      item.ingredient.name
                                    )}
                                  </span>
                                ))}
                                {missingNames.length > 0 && (
                                  <>
                                    {result.items.length > 0 ? ", " : ""}
                                    <span className="italic text-[var(--berry)]">
                                      {missingNames.join(", ")} (not in stock)
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                missingNames.length > 0 &&
                                updateRecipe(recipe.id, { missingIngredientNames: undefined })
                              }
                              title={missingNames.length > 0 ? "Mark as in stock" : undefined}
                              className={missingNames.length > 0 ? "cursor-pointer" : "cursor-default"}
                            >
                              <StatusBadge status={missingNames.length > 0 ? "purchase" : result.status} />
                            </button>
                          </div>
                          {result.items.some((i) => i.status === "substitute") && (
                            <p className="mt-2 border-t border-[var(--cream-dim)]/10 pt-2 text-xs text-[var(--cream-dim)]">
                              {result.items
                                .filter((i) => i.status === "substitute")
                                .map(
                                  (i) =>
                                    `We have ${i.substitute?.name} — use it in place of ${i.ingredient.name}`,
                                )
                                .join(". ")}
                            </p>
                          )}
                          {result.toPurchase.length > 0 && (
                            <p className="mt-2 border-t border-[var(--cream-dim)]/10 pt-2 text-xs text-[var(--cream-dim)]">
                              No substitute on file — buy{" "}
                              {result.toPurchase.map((i) => i.name).join(", ")} to make this
                            </p>
                          )}
                          {missingNames.length > 0 && (
                            <p className="mt-2 border-t border-[var(--cream-dim)]/10 pt-2 text-xs text-[var(--cream-dim)]">
                              Not in your stock at all — flagged on the Experiment Lab page:{" "}
                              {missingNames.join(", ")}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => startEditRecipe(recipe)}
                              className="text-xs text-[var(--teal)] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendToLab(recipe)}
                              className="text-xs text-[var(--teal)] hover:underline"
                            >
                              Send to Experiment Lab
                            </button>
                            <ConfirmButton
                              disabled={locked}
                              onConfirm={() => removeRecipe(recipe.id)}
                              label="Remove"
                              className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                              confirmClassName="text-xs font-medium text-[var(--berry)]"
                            />
                          </div>
                        </>
                      )}
                      </fieldset>
                    </div>
                  )
                })}
              </div>

              {isActive && (
                <fieldset disabled={locked} className="contents">
                <div className="mt-3 space-y-2 rounded-md border border-dashed border-[var(--cream-dim)]/25 p-3">
                  <input
                    className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
                    placeholder="Cocktail name"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                  />
                  <IngredientPicker
                    ingredients={ingredients}
                    selectedIds={recipeIngredientIds}
                    onChange={setRecipeIngredientIds}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddRecipe(scan.id)}
                    className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
                  >
                    Save cocktail
                  </button>
                </div>
                </fieldset>
              )}
            </RevealOnScroll>
          )
        })}
      </section>

      {enlargedPhoto && (
        <button
          type="button"
          onClick={() => setEnlargedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <img src={enlargedPhoto} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </button>
      )}
    </div>
  )
}
