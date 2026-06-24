import { useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { checkRecipe } from "../lib/recipeCheck"
import { margin, marginPercent, recipeCost } from "../lib/cost"
import StatusBadge from "../components/StatusBadge"
import FallingBottles from "../components/FallingBottles"
import RevealOnScroll from "../components/RevealOnScroll"
import gordonsBottle from "../assets/gordons-bottle.webp"
import type { MenuCategory } from "../types"

const TABS: { value: MenuCategory; label: string }[] = [
  { value: "core", label: "Core Menu" },
  { value: "seasonal", label: "Seasonal Specials" },
  { value: "event-special", label: "Event Specials" },
  { value: "venue-hybrid", label: "Venue Hybrids" },
  { value: "mocktail", label: "Mocktails" },
  { value: "discontinued", label: "Discontinued" },
]

export default function MyMenuPage() {
  const { recipes, updateRecipe, removeRecipe, ingredients, substitutions } = useData()
  const [tab, setTab] = useState<MenuCategory>("core")

  const allMenuRecipes = recipes.filter((r) => r.venueId === null)
  const menuRecipes = byName(allMenuRecipes.filter((r) => (r.menuCategory ?? "core") === tab))
  const byId = new Map(ingredients.map((i) => [i.id, i]))

  return (
    <div className="relative space-y-4">
      <FallingBottles bottleImg={gordonsBottle} />
      <RevealOnScroll>
        <h1 className="mb-1 text-lg font-medium">My Cocktails</h1>
        <p className="text-sm text-[var(--cream-dim)]">
          Cocktails you've promoted from the Archive. Tap "Add to my menu" on a successful
          experiment to land it here.
        </p>
      </RevealOnScroll>

      <div className="flex flex-nowrap gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs ${
              tab === t.value
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-[var(--surface-raised)] text-[var(--cream-dim)]"
            }`}
          >
            {t.label} ({allMenuRecipes.filter((r) => (r.menuCategory ?? "core") === t.value).length})
          </button>
        ))}
      </div>

      <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
        {menuRecipes.length === 0 && (
          <p className="p-4 text-sm text-[var(--cream-dim)]">
            Nothing in {TABS.find((t) => t.value === tab)?.label.toLowerCase()} yet.
          </p>
        )}
        {menuRecipes.map((recipe, i) => {
          const result = checkRecipe(recipe, ingredients, substitutions)
          const cost = recipeCost(recipe, ingredients)
          const sellPrice = recipe.sellPrice ?? 0
          const recipeMargin = margin(sellPrice, cost)
          const marginPct = marginPercent(sellPrice, cost)

          return (
            <RevealOnScroll key={recipe.id} delay={Math.min(i, 8) * 60} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{recipe.name}</p>
                  <p className="text-xs text-[var(--cream-dim)]">
                    {recipe.ingredientIds
                      .map((id) => byId.get(id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <StatusBadge status={result.status} />
                  <label className="flex items-center gap-1 text-xs text-[var(--cream-dim)]">
                    Move to
                    <select
                      value={recipe.menuCategory ?? "core"}
                      onChange={(e) => updateRecipe(recipe.id, { menuCategory: e.target.value as MenuCategory })}
                      className="h-7 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-1.5 text-xs text-[var(--cream)]"
                    >
                      {TABS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRecipe(recipe.id)}
                    className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-4 border-t border-[var(--cream-dim)]/10 pt-3">
                <div>
                  <p className="text-[11px] text-[var(--cream-dim)]">Cost / serving (30ml)</p>
                  <p className="text-sm">${cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-[var(--cream-dim)]">Sell price</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--cream-dim)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-7 w-20 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-1.5 text-xs text-[var(--cream)]"
                      placeholder="0.00"
                      defaultValue={recipe.sellPrice ?? ""}
                      onBlur={(e) => {
                        const price = parseFloat(e.target.value)
                        updateRecipe(recipe.id, {
                          sellPrice: Number.isFinite(price) && price > 0 ? price : undefined,
                        })
                      }}
                    />
                  </div>
                </div>
                {recipe.sellPrice !== undefined && (
                  <div>
                    <p className="text-[11px] text-[var(--cream-dim)]">Margin</p>
                    <p
                      className={`text-sm font-medium ${
                        recipeMargin >= 0 ? "text-[var(--sage)]" : "text-[var(--berry)]"
                      }`}
                    >
                      ${recipeMargin.toFixed(2)}
                      {marginPct !== null ? ` (${marginPct.toFixed(0)}%)` : ""}
                    </p>
                  </div>
                )}
              </div>
            </RevealOnScroll>
          )
        })}
      </div>
    </div>
  )
}
