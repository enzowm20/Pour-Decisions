import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import { checkRecipe } from "../lib/recipeCheck"
import { fileToDataUrl } from "../lib/storage"
import { byName } from "../lib/sort"
import { extractTextFromFile } from "../lib/textExtraction"
import { parseMenuText } from "../lib/menuParser"
import { findFuzzyMatch } from "../lib/fuzzyMatch"
import IngredientPicker from "../components/IngredientPicker"
import StatusBadge from "../components/StatusBadge"
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
  const navigate = useNavigate()
  const {
    venues,
    scans,
    addScan,
    updateScan,
    removeScan,
    recipes,
    addRecipe,
    removeRecipe,
    ingredients,
    substitutions,
  } = useData()

  const venue = venues.find((v) => v.id === routeVenueId)

  const [activeScanId, setActiveScanId] = useState<string | null>(null)
  const [recipeName, setRecipeName] = useState("")
  const [recipeIngredientIds, setRecipeIngredientIds] = useState<string[]>([])

  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState("")
  const [reviewRecipes, setReviewRecipes] = useState<ReviewRecipe[] | null>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [manualIngredientDrafts, setManualIngredientDrafts] = useState<Record<number, string>>({})
  const [saveStatus, setSaveStatus] = useState("")

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

  const handleSendToLab = (recipe: { name: string; ingredientIds: string[] }) => {
    const params = new URLSearchParams({ name: recipe.name, ingredients: recipe.ingredientIds.join(",") })
    navigate(`/lab?${params.toString()}`)
  }

  const handleStartBlankScan = () => {
    const scan = addScan({
      venueId,
      date: new Date().toISOString().slice(0, 10),
      photoDate: new Date().toISOString().slice(0, 10),
      photos: [],
    })
    setActiveScanId(scan.id)
  }

  const handleMenuFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setIsProcessing(true)
    setParseError("")
    setReviewRecipes(null)
    setSaveStatus("")

    try {
      const [text, photoDataUrl] = await Promise.all([
        extractTextFromFile(file),
        file.type.startsWith("image/") ? fileToDataUrl(file) : Promise.resolve(null),
      ])
      const parsed = parseMenuText(text)
      setPendingPhoto(photoDataUrl)
      setReviewRecipes(
        parsed.map((r) => ({
          name: r.name,
          include: true,
          ingredients: r.ingredientNames.map((n) => buildReviewIngredient(n, ingredients)),
        })),
      )
      if (parsed.length === 0) {
        setParseError(
          "Couldn't find anything that looked like a recipe in this file. If it's a scanned PDF with no real text layer, try uploading it as an image instead.",
        )
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Couldn't read that file.")
    } finally {
      setIsProcessing(false)
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

    for (const r of included) {
      const ingredientIds: string[] = []
      const missingIngredientNames: string[] = []
      for (const ing of r.ingredients) {
        if (ing.resolvedId) ingredientIds.push(ing.resolvedId)
        else missingIngredientNames.push(ing.raw)
      }
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
    <div className="space-y-6">
      <div>
        <Link to="/venues" className="text-xs text-[var(--cream-dim)] hover:underline">
          ← Venue scans
        </Link>
        <h1 className="mt-1 text-lg font-medium">{venue.name}</h1>
      </div>

      {purchaseMap.size > 0 && (
        <div className="rounded-md bg-[var(--gold)]/15 px-3 py-2 text-sm text-[var(--gold)]">
          Shopping list to make everything from this venue:{" "}
          {Array.from(purchaseMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, count]) => `${name} (used in ${count})`)
            .join(", ")}
        </div>
      )}

      <section className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
        <p className="mb-1 text-sm font-medium">Import menu from a photo or PDF</p>
        <p className="mb-3 text-xs text-[var(--cream-dim)]">
          Upload a photo of {venue.name}'s menu, or a PDF, and this reads the text and proposes
          recipes for you to review below before saving. Runs entirely in your browser — no
          ingredients are created automatically. An exact stock match is used right away; a close
          match (like "Aperol" against your "Aperol Aperitivo") is suggested for you to confirm,
          not assumed silently. Anything left unmatched is saved by name and flagged on the
          Experiment Lab page.
        </p>

        <div className="mb-3 flex items-center gap-2">
          <label className="text-xs text-[var(--cream-dim)]">Date the photo was taken</label>
          <input
            type="date"
            className="h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)]"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
          />
        </div>

        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleMenuFileSelected}
          disabled={isProcessing}
          className="text-sm"
        />
        {isProcessing && <p className="mt-2 text-xs text-[var(--cream-dim)]">Reading file…</p>}
        {parseError && <p className="mt-2 text-xs text-[var(--berry)]">{parseError}</p>}
        {saveStatus && <p className="mt-2 text-xs text-[var(--sage)]">{saveStatus}</p>}

        <button
          type="button"
          onClick={handleStartBlankScan}
          className="mt-3 text-xs text-[var(--teal)] hover:underline"
        >
          Or start a blank scan to log cocktails by hand instead
        </button>

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
      </section>

      <section className="space-y-4">
        {venueScans.length === 0 && (
          <p className="text-sm text-[var(--cream-dim)]">No scans yet for this venue.</p>
        )}
        {venueScans.map((scan) => {
          const scanRecipes = byName(recipes.filter((r) => r.scanId === scan.id))
          const isActive = activeScanId === scan.id
          return (
            <div key={scan.id} className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-[var(--cream-dim)]">Photo taken</label>
                    <input
                      type="date"
                      className="h-8 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)]"
                      value={scan.photoDate}
                      onChange={(e) => updateScan(scan.id, { photoDate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-[var(--cream-dim)]">Logged</label>
                    <input
                      type="date"
                      className="h-8 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)]"
                      value={scan.date}
                      onChange={(e) => updateScan(scan.id, { date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveScanId(isActive ? null : scan.id)}
                    className="text-xs text-[var(--teal)] hover:underline"
                  >
                    {isActive ? "Done adding" : "Add cocktail"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeScan(scan.id)}
                    className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                  >
                    Remove scan
                  </button>
                </div>
              </div>

              {scan.photos.length > 0 && (
                <div className="mb-3 flex gap-2">
                  {scan.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="h-20 w-20 rounded-md object-cover" />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {scanRecipes.map((recipe) => {
                  const result = checkRecipe(recipe, ingredients, substitutions)
                  const missingNames = recipe.missingIngredientNames ?? []
                  return (
                    <div key={recipe.id} className="rounded-md border border-[var(--cream-dim)]/15 p-3">
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
                        <StatusBadge status={missingNames.length > 0 ? "purchase" : result.status} />
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
                          onClick={() => handleSendToLab(recipe)}
                          className="text-xs text-[var(--teal)] hover:underline"
                        >
                          Send to Experiment Lab
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecipe(recipe.id)}
                          className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {isActive && (
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
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
