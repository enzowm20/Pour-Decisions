import { useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import DrainingBackground from "../components/DrainingBackground"
import FallingBottles from "../components/FallingBottles"
import logoGordons from "../assets/logo-gordons.png"
import gordonsBottle from "../assets/gordons-bottle.webp"
import type { MenuCategory } from "../types"

const TABS: { value: MenuCategory; label: string }[] = [
  { value: "core", label: "Core Menu" },
  { value: "seasonal", label: "Seasonal Specials" },
]

// Public, view-only menu — no password, no staff nav, no cost/margin/editing.
// Reads the same local data as the staff pages, so it only shows your menu
// when opened on this same device/browser (there's no shared backend).
export default function PublicMenuPage() {
  const { recipes, ingredients } = useData()
  const [tab, setTab] = useState<MenuCategory>("core")
  const [orderedId, setOrderedId] = useState<string | null>(null)

  const allMenuRecipes = recipes.filter((r) => r.venueId === null)
  const menuRecipes = byName(allMenuRecipes.filter((r) => (r.menuCategory ?? "core") === tab))
  const byId = new Map(ingredients.map((i) => [i.id, i]))

  function handleOrder(recipeId: string) {
    setOrderedId(recipeId)
  }

  return (
    <div className="theme-gordons min-h-screen text-[var(--cream)]">
      <DrainingBackground />
      <FallingBottles bottleImg={gordonsBottle} />

      {/* Matches the staff header's format — logo on a cream strip, just larger,
          since this is the only thing in this page's header. */}
      <header className="border-b border-[var(--cream-dim)]/15 bg-[var(--cream)]">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-3">
          <img src={logoGordons} alt="Pour Decisions — match, mix, sip" className="h-28 w-auto sm:h-44" />
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface)] p-4 sm:p-6">
          <h1 className="mb-1 text-center text-lg font-medium">Our Menu</h1>
          <p className="mb-6 text-center text-sm text-[var(--cream-dim)]">
            What we're pouring right now.
          </p>

          <div className="mb-4 flex justify-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  tab === t.value
                    ? "bg-[var(--primary)] text-[var(--on-primary)]"
                    : "bg-[var(--surface-raised)] text-[var(--cream-dim)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
            {menuRecipes.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--cream-dim)]">
                Nothing listed here yet — check back soon.
              </p>
            )}
            {menuRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{recipe.name}</p>
                  <p className="text-xs text-[var(--cream-dim)]">
                    {recipe.ingredientIds
                      .map((id) => byId.get(id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {recipe.sellPrice !== undefined && (
                    <p className="mt-1 text-sm font-medium">${recipe.sellPrice.toFixed(2)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleOrder(recipe.id)}
                  className="flex-shrink-0 rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
                >
                  {orderedId === recipe.id ? "Ordered ✓" : "Order"}
                </button>
              </div>
            ))}
          </div>

          {orderedId && (
            <p className="mt-4 text-center text-xs text-[var(--cream-dim)]">
              Let your bartender know what you'd like — this page doesn't send orders anywhere on
              its own.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
