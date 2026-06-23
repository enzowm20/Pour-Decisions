import { useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import FallingBottles from "../components/FallingBottles"
import RevealOnScroll from "../components/RevealOnScroll"
import SubstitutionManager from "../components/SubstitutionManager"
import FlaggedIngredients from "../components/FlaggedIngredients"
import chambordBottle from "../assets/chambord-bottle.webp"

export default function VenuesPage() {
  const { venues, addVenue, updateVenue, scans, recipes, removeVenue } = useData()
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addVenue({ name: name.trim() })
    setName("")
  }

  function startEdit(id: string, current: string) {
    setEditingId(id)
    setEditName(current)
  }

  function saveEdit() {
    if (editingId && editName.trim()) updateVenue(editingId, { name: editName.trim() })
    setEditingId(null)
  }

  return (
    <div className="relative">
      <FallingBottles bottleImg={chambordBottle} />
      <RevealOnScroll>
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
      </RevealOnScroll>

      <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
        {venues.length === 0 && (
          <p className="p-4 text-sm text-[var(--cream-dim)]">No venues yet.</p>
        )}
        {byName(venues).map((venue, i) => {
          const venueScans = scans.filter((s) => s.venueId === venue.id)
          const cocktailCount = recipes.filter((r) => r.venueId === venue.id).length
          return (
            <RevealOnScroll key={venue.id} delay={Math.min(i, 8) * 60} className="flex items-center justify-between p-3">
              {editingId === venue.id ? (
                <input
                  autoFocus
                  className="h-8 min-w-0 flex-1 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit()
                    if (e.key === "Escape") setEditingId(null)
                  }}
                />
              ) : (
                <Link
                  to={`/venues/${venue.id}`}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    startEdit(venue.id, venue.name)
                  }}
                  className="min-w-0"
                  title="Double-click the name to rename"
                >
                  <p className="text-sm font-medium">{venue.name}</p>
                  <p className="text-xs text-[var(--cream-dim)]">
                    {venueScans.length} scan{venueScans.length === 1 ? "" : "s"} ·{" "}
                    {cocktailCount} cocktail{cocktailCount === 1 ? "" : "s"} logged
                  </p>
                </Link>
              )}
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
            </RevealOnScroll>
          )
        })}
      </div>

      <RevealOnScroll className="mt-8 border-t border-[var(--cream-dim)]/15 pt-6">
        <SubstitutionManager />
        <FlaggedIngredients />
      </RevealOnScroll>
    </div>
  )
}
