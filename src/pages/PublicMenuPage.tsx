import { useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import DrainingBackground from "../components/DrainingBackground"
import FallingBottles from "../components/FallingBottles"
import RevealOnScroll from "../components/RevealOnScroll"
import logoLimoncello from "../assets/logo-limoncello.png"
import limoncelloBottle from "../assets/limoncello-bottle.webp"
import type { MenuCategory } from "../types"

const TABS: { value: MenuCategory; label: string }[] = [
  { value: "core", label: "Core Menu" },
  { value: "seasonal", label: "Seasonal Specials" },
  { value: "venue-hybrid", label: "Venue Hybrids" },
  { value: "mocktail", label: "Mocktails" },
]

// Public, view-only menu — no password, no staff nav, no cost/margin/editing.
// Reads the same local data as the staff pages, so it only shows your menu
// when opened on this same device/browser (there's no shared backend).
export default function PublicMenuPage() {
  const { recipes, ingredients, experiments } = useData()
  const [tab, setTab] = useState<MenuCategory>("core")
  const [orderedId, setOrderedId] = useState<string | null>(null)

  const allMenuRecipes = recipes.filter((r) => r.venueId === null)
  const menuRecipes = byName(allMenuRecipes.filter((r) => (r.menuCategory ?? "core") === tab))
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  // A menu recipe doesn't carry its own photo — it was copied over from an
  // Archive experiment by name when promoted, so that's where the photo
  // still lives. Matched by name since there's no recipeId link between them.
  const photoByName = new Map(
    experiments.filter((e) => e.photos.length > 0).map((e) => [e.name.toLowerCase(), e.photos[0]]),
  )

  function handleOrder(recipeId: string) {
    setOrderedId(recipeId)
  }

  return (
    <div className="theme-limoncello min-h-screen text-[var(--cream)]">
      <DrainingBackground />
      <FallingBottles bottleImg={limoncelloBottle} />

      <span className="pointer-events-none fixed bottom-2 left-2 z-20 text-[10px] text-[var(--cream-dim)]/70">
        Designed by Lorenzo Montenegro
      </span>

      {/* Matches the staff header's format — logo on a cream strip, just larger,
          since this is the only thing in this page's header. */}
      <header className="border-b border-[var(--cream-dim)]/15 bg-[var(--cream)]">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-3">
          <img src={logoLimoncello} alt="Pour Decisions — match, mix, sip" className="h-28 w-auto sm:h-44" />
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-6">
        <RevealOnScroll className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface)] p-4 sm:p-6">
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
            {menuRecipes.map((recipe, i) => {
              const photo = recipe.photo ?? photoByName.get(recipe.name.toLowerCase())
              return (
                <RevealOnScroll
                  key={recipe.id}
                  delay={Math.min(i, 8) * 60}
                  className="flex flex-wrap items-stretch justify-between gap-4 p-4"
                >
                  {/* Description on the left in a full-height column: details
                      at the top, then the order button pushed to the bottom
                      (mt-auto) so it lines up with the bottom of the portrait
                      photo on the right. */}
                  <div className="flex min-w-[180px] flex-1 flex-col">
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
                    <button
                      type="button"
                      onClick={() => handleOrder(recipe.id)}
                      className="mt-auto self-start rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
                    >
                      {orderedId === recipe.id ? "Ordered ✓" : "Order Cocktail"}
                    </button>
                  </div>
                  {/* Portrait (3:4) photo on the right. */}
                  {photo && (
                    <img
                      src={photo}
                      alt={recipe.name}
                      className="aspect-[3/4] w-44 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}
                </RevealOnScroll>
              )
            })}
          </div>

          {orderedId && (
            <p className="mt-4 text-center text-xs text-[var(--cream-dim)]">
              Let your bartender know what you'd like — this page doesn't send orders anywhere on
              its own.
            </p>
          )}
        </RevealOnScroll>
      </main>
    </div>
  )
}
