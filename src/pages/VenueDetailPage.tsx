import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import { checkRecipe } from "../lib/recipeCheck"
import { fileToDataUrl } from "../lib/storage"
import { byName } from "../lib/sort"
import { SEED_EXPERIMENTS, SEED_INGREDIENTS } from "../lib/fiddlerImport"
import IngredientPicker from "../components/IngredientPicker"
import StatusBadge from "../components/StatusBadge"

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
    addIngredient,
    substitutions,
  } = useData()

  const venue = venues.find((v) => v.id === routeVenueId)

  const [scanDate, setScanDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [photos, setPhotos] = useState<string[]>([])
  const [activeScanId, setActiveScanId] = useState<string | null>(null)

  const [recipeName, setRecipeName] = useState("")
  const [recipeIngredientIds, setRecipeIngredientIds] = useState<string[]>([])
  const [importStatus, setImportStatus] = useState("")

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

  const handleImportMenu = () => {
    const scan = addScan({ venueId, date: new Date().toISOString().slice(0, 10), photos: [] })

    const nameToId = new Map(ingredients.map((i) => [i.name.toLowerCase(), i.id]))
    let newIngredients = 0
    for (const seed of SEED_INGREDIENTS) {
      const key = seed.name.toLowerCase()
      if (nameToId.has(key)) continue
      const created = addIngredient({
        name: seed.name,
        category: seed.category,
        tags: seed.tags,
        styles: seed.styles,
        inStock: true,
      })
      nameToId.set(key, created.id)
      newIngredients++
    }

    const existingRecipeNames = new Set(
      recipes.filter((r) => r.venueId === venueId).map((r) => r.name.toLowerCase()),
    )
    let newRecipes = 0
    for (const seed of SEED_EXPERIMENTS) {
      if (existingRecipeNames.has(seed.name.toLowerCase())) continue
      const ingredientIds = seed.ingredientNames
        .map((n) => nameToId.get(n.toLowerCase()))
        .filter((id): id is string => Boolean(id))

      addRecipe({ name: seed.name, venueId, scanId: scan.id, ingredientIds })
      newRecipes++
    }

    setImportStatus(
      `Added ${newRecipes} recipe${newRecipes === 1 ? "" : "s"} and created ${newIngredients} new ingredient${newIngredients === 1 ? "" : "s"}.`,
    )
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
        <p className="mb-1 text-sm font-medium">Import Fiddler Cocktail Menu (2027)</p>
        <p className="mb-3 text-xs text-[var(--cream-dim)]">
          Adds a new scan to {venue.name} containing every recipe from the PDF, creating any
          missing ingredients (tagged with flavor and style) along the way. Safe to run more than
          once — matching recipe and ingredient names are skipped.
        </p>
        <button
          type="button"
          onClick={handleImportMenu}
          className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
        >
          Import menu
        </button>
        {importStatus && <p className="mt-2 text-xs text-[var(--sage)]">{importStatus}</p>}
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
                          </p>
                        </div>
                        <StatusBadge status={result.status} />
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
