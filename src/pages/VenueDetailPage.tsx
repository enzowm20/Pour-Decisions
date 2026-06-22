import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import { checkRecipe } from "../lib/recipeCheck"
import { fileToDataUrl } from "../lib/storage"
import { byName } from "../lib/sort"
import { extractTextFromFile } from "../lib/textExtraction"
import { parseMenuText, type ParsedRecipe } from "../lib/menuParser"
import IngredientPicker from "../components/IngredientPicker"
import StatusBadge from "../components/StatusBadge"

interface ReviewRecipe extends ParsedRecipe {
  include: boolean
  ingredientText: string // editable comma-separated text backing ingredientNames
}

export default function VenueDetailPage() {
  const { venueId: routeVenueId } = useParams()
  const navigate = useNavigate()
  const {
    venues,
    scans,
    addScan,
    removeScan,
    recipes,
    addRecipe,
    removeRecipe,
    ingredients,
    substitutions,
  } = useData()

  const venue = venues.find((v) => v.id === routeVenueId)

  const [scanDate, setScanDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [photos, setPhotos] = useState<string[]>([])
  const [activeScanId, setActiveScanId] = useState<string | null>(null)

  const [recipeName, setRecipeName] = useState("")
  const [recipeIngredientIds, setRecipeIngredientIds] = useState<string[]>([])

  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState("")
  const [reviewRecipes, setReviewRecipes] = useState<ReviewRecipe[] | null>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState("")

  if (!venue) {
    return <p className="text-sm text-[var(--cream-dim)]">Venue not found.</p>
  }

  const venueScans = scans
    .filter((s) => s.venueId === venue.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const venueId = venue.id

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const urls = await Promise.all(files.map(fileToDataUrl))
    setPhotos((prev) => [...prev, ...urls])
  }

  const handleAddScan = (e: React.FormEvent) => {
    e.preventDefault()
    const scan = addScan({ venueId, date: scanDate, photos })
    setPhotos([])
    setActiveScanId(scan.id)
  }

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
        parsed.map((r) => ({ ...r, include: true, ingredientText: r.ingredientNames.join(", ") })),
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

  function handleSaveReviewed() {
    if (!reviewRecipes) return
    const included = reviewRecipes.filter((r) => r.include && r.name.trim())
    if (included.length === 0) return

    const byNameLower = new Map(ingredients.map((i) => [i.name.toLowerCase(), i.id]))
    const scan = addScan({
      venueId,
      date: new Date().toISOString().slice(0, 10),
      photos: pendingPhoto ? [pendingPhoto] : [],
    })

    for (const r of included) {
      const names = r.ingredientText
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
      const ingredientIds: string[] = []
      const missingIngredientNames: string[] = []
      for (const n of names) {
        const id = byNameLower.get(n.toLowerCase())
        if (id) ingredientIds.push(id)
        else missingIngredientNames.push(n)
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
          recipes for you to review below before saving. It runs entirely in your browser — no
          ingredients are created automatically; anything that doesn't match your stock is saved
          by name and flagged on the Experiment Lab page for you to substitute. OCR on photos is
          rough — check the review list before saving.
        </p>
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

        {reviewRecipes && reviewRecipes.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--cream-dim)]">
              Review what was found — edit names/ingredients, untick anything wrong, then save.
            </p>
            {reviewRecipes.map((r, i) => (
              <div
                key={i}
                className="flex flex-wrap items-start gap-2 rounded-md border border-[var(--cream-dim)]/15 p-2"
              >
                <input
                  type="checkbox"
                  checked={r.include}
                  onChange={(e) => updateReviewRecipe(i, { include: e.target.checked })}
                  className="mt-2"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    className="h-8 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)]"
                    value={r.name}
                    onChange={(e) => updateReviewRecipe(i, { name: e.target.value })}
                  />
                  <input
                    className="h-8 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)]"
                    value={r.ingredientText}
                    onChange={(e) => updateReviewRecipe(i, { ingredientText: e.target.value })}
                    placeholder="Comma-separated ingredients"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleSaveReviewed}
              className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
            >
              Save reviewed recipes
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
        <h2 className="mb-3 text-sm font-medium">New Scan</h2>
        <form onSubmit={handleAddScan} className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--cream-dim)]">Date</label>
            <input
              type="date"
              className="h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)]"
              value={scanDate}
              onChange={(e) => setScanDate(e.target.value)}
            />
          </div>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="text-sm" />
          {photos.length > 0 && (
            <div className="flex gap-2">
              {photos.map((p, i) => (
                <img key={i} src={p} alt="" className="h-16 w-16 rounded-md object-cover" />
              ))}
            </div>
          )}
          <button
            type="submit"
            className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
          >
            Save scan
          </button>
        </form>
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
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">{scan.date}</p>
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
