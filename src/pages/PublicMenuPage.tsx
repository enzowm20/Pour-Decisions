import { useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import logoGordons from "../assets/logo-gordons.png"
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

  const allMenuRecipes = recipes.filter((r) => r.venueId === null)
  const menuRecipes = byName(allMenuRecipes.filter((r) => (r.menuCategory ?? "core") === tab))
  const byId = new Map(ingredients.map((i) => [i.id, i]))

  return (
    <div className="theme-gordons min-h-screen text-[var(--cream)]">
      <header className="border-b border-[var(--cream-dim)]/15 bg-[var(--cream)] py-4">
        <div className="mx-auto flex max-w-2xl justify-center px-4">
          <img src={logoGordons} alt="Pour Decisions" className="h-20 w-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
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
              </div>
              {recipe.sellPrice !== undefined && (
                <p className="flex-shrink-0 text-sm font-medium">${recipe.sellPrice.toFixed(2)}</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
