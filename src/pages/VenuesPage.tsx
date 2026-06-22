import { useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { SEED_EXPERIMENTS, SEED_INGREDIENTS } from "../lib/fiddlerImport"

const FIDDLER_VENUE_NAME = "The Fiddler"

export default function VenuesPage() {
  const { venues, addVenue, scans, addScan, recipes, addRecipe, ingredients, addIngredient, removeVenue } =
    useData()
  const [name, setName] = useState("")
  const [importStatus, setImportStatus] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addVenue({ name: name.trim() })
    setName("")
  }

  function importFiddlerMenu() {
    const fiddler =
      venues.find((v) => v.name.toLowerCase() === FIDDLER_VENUE_NAME.toLowerCase()) ??
      addVenue({ name: FIDDLER_VENUE_NAME })

    const scan = addScan({ venueId: fiddler.id, date: new Date().toISOString().slice(0, 10), photos: [] })

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
      recipes.filter((r) => r.venueId === fiddler.id).map((r) => r.name.toLowerCase()),
    )
    let newRecipes = 0
    for (const seed of SEED_EXPERIMENTS) {
      if (existingRecipeNames.has(seed.name.toLowerCase())) continue
      const ingredientIds = seed.ingredientNames
        .map((n) => nameToId.get(n.toLowerCase()))
        .filter((id): id is string => Boolean(id))

      addRecipe({ name: seed.name, venueId: fiddler.id, scanId: scan.id, ingredientIds })
      newRecipes++
    }

    setImportStatus(
      `Added ${newRecipes} recipe${newRecipes === 1 ? "" : "s"} to The Fiddler's menu and created ${newIngredients} new ingredient${newIngredients === 1 ? "" : "s"}.`,
    )
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium">Venue Scans</h1>
      <p className="mb-4 text-sm text-[var(--cream-dim)]">
        Track other venues' menus over time and compare them to your stock.
      </p>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          className="h-9 flex-1 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
          placeholder="Venue name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
        >
          Add venue
        </button>
      </form>

      <div className="mb-4 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
        <p className="mb-1 text-sm font-medium">Import Fiddler Cocktail Menu (2027)</p>
        <p className="mb-3 text-xs text-[var(--cream-dim)]">
          Adds The Fiddler as a venue with a new scan containing every recipe from the PDF,
          creating any missing ingredients (tagged with flavor and style) along the way. From
          there, open the venue to compare each recipe against your stock and send any you want to
          actually try over to the Archive. Safe to run more than once — matching venue, recipe,
          and ingredient names are skipped.
        </p>
        <button
          type="button"
          onClick={importFiddlerMenu}
          className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
        >
          Import menu
        </button>
        {importStatus && <p className="mt-2 text-xs text-[var(--sage)]">{importStatus}</p>}
      </div>

      <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
        {venues.length === 0 && (
          <p className="p-4 text-sm text-[var(--cream-dim)]">No venues yet.</p>
        )}
        {byName(venues).map((venue) => {
          const venueScans = scans.filter((s) => s.venueId === venue.id)
          return (
            <div key={venue.id} className="flex items-center justify-between p-3">
              <Link to={`/venues/${venue.id}`} className="min-w-0">
                <p className="text-sm font-medium">{venue.name}</p>
                <p className="text-xs text-[var(--cream-dim)]">
                  {venueScans.length} scan{venueScans.length === 1 ? "" : "s"}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <Link to={`/venues/${venue.id}`} className="text-xs text-[var(--teal)] hover:underline">
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => removeVenue(venue.id)}
                  className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
