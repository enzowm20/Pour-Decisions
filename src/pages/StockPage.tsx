import { useMemo, useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import SubstitutionManager from "../components/SubstitutionManager"
import {
  CATEGORY_LABELS,
  FLAVOR_TAGS,
  STYLE_LABELS,
  STYLE_TAGS,
  type FlavorTag,
  type IngredientCategory,
  type StyleTag,
} from "../types"

const categories: IngredientCategory[] = ["spirit", "mixer", "citrus", "sweetener", "other"]

export default function StockPage() {
  const { ingredients, addIngredient, updateIngredient, removeIngredient } = useData()

  const [name, setName] = useState("")
  const [category, setCategory] = useState<IngredientCategory>("spirit")
  const [tags, setTags] = useState<FlavorTag[]>([])
  const [styles, setStyles] = useState<StyleTag[]>([])
  const [costPerServing, setCostPerServing] = useState("")

  const [viewCategory, setViewCategory] = useState<IngredientCategory | "all">("all")
  const [editingStylesId, setEditingStylesId] = useState<string | null>(null)

  function toggleTag(tag: FlavorTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function toggleStyle(style: StyleTag) {
    setStyles((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]))
  }

  function toggleIngredientStyle(ingredientId: string, currentStyles: StyleTag[], style: StyleTag) {
    const next = currentStyles.includes(style)
      ? currentStyles.filter((s) => s !== style)
      : [...currentStyles, style]
    updateIngredient(ingredientId, { styles: next })
  }

  function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const cost = parseFloat(costPerServing)
    addIngredient({
      name: name.trim(),
      category,
      tags,
      styles,
      inStock: true,
      costPerServing: Number.isFinite(cost) && cost > 0 ? cost : undefined,
    })
    setName("")
    setTags([])
    setStyles([])
    setCostPerServing("")
  }

  const visibleIngredients = useMemo(
    () =>
      byName(viewCategory === "all" ? ingredients : ingredients.filter((i) => i.category === viewCategory)),
    [ingredients, viewCategory],
  )

  const inputClass =
    "h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
  const buttonClass =
    "h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-1 text-lg font-medium">Your Stock</h1>
        <p className="mb-4 text-sm text-[var(--cream-dim)]">
          Add every ingredient you carry. Toggle in/out of stock as it runs out.
        </p>

        <form onSubmit={handleAddIngredient} className="mb-4 flex flex-wrap items-end gap-2">
          <input
            className={`${inputClass} flex-1 min-w-[160px]`}
            placeholder="Ingredient name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className={`${inputClass} px-2`}
            value={category}
            onChange={(e) => setCategory(e.target.value as IngredientCategory)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            className={`${inputClass} w-28`}
            placeholder="Cost / serving"
            value={costPerServing}
            onChange={(e) => setCostPerServing(e.target.value)}
          />
          <button type="submit" className={buttonClass}>
            Add ingredient
          </button>
        </form>

        <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Flavor</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {FLAVOR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-xs ${
                tags.includes(tag)
                  ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                  : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs text-[var(--cream-dim)]">
          Cocktail style — what it actually gets used in, so the lab doesn't pair it with
          unrelated ingredients
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {STYLE_TAGS.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              className={`rounded-full border px-3 py-1 text-xs ${
                styles.includes(style)
                  ? "border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
                  : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
              }`}
            >
              {STYLE_LABELS[style]}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(["all", ...categories] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setViewCategory(c)}
              className={`rounded-full px-3 py-1 text-xs ${
                viewCategory === c
                  ? "bg-[var(--teal)] text-[var(--on-teal)]"
                  : "bg-[var(--surface-raised)] text-[var(--cream-dim)]"
              }`}
            >
              {c === "all" ? "All" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
          {visibleIngredients.length === 0 && (
            <p className="p-4 text-sm text-[var(--cream-dim)]">No ingredients in this category yet.</p>
          )}
          {visibleIngredients.map((ing) => {
            const ingStyles = ing.styles ?? []
            const isEditingStyles = editingStylesId === ing.id
            return (
              <div key={ing.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ing.name}</p>
                    <p className="text-xs text-[var(--cream-dim)]">
                      {CATEGORY_LABELS[ing.category]}
                      {ing.tags.length > 0 ? ` · ${[...ing.tags].sort().join(", ")}` : ""}
                      {ingStyles.length > 0
                        ? ` · ${ingStyles.map((s) => STYLE_LABELS[s]).sort().join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[var(--cream-dim)]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-7 w-16 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-1.5 text-xs text-[var(--cream)]"
                        placeholder="0.00"
                        defaultValue={ing.costPerServing ?? ""}
                        onBlur={(e) => {
                          const cost = parseFloat(e.target.value)
                          updateIngredient(ing.id, {
                            costPerServing: Number.isFinite(cost) && cost > 0 ? cost : undefined,
                          })
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingStylesId(isEditingStyles ? null : ing.id)}
                      className="text-xs text-[var(--teal)] hover:underline"
                    >
                      {isEditingStyles ? "Done" : "Edit style"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateIngredient(ing.id, { inStock: !ing.inStock })}
                      className={`rounded-full px-3 py-1 text-xs ${
                        ing.inStock
                          ? "bg-[var(--sage)] text-[var(--on-sage)]"
                          : "bg-[var(--bg)] text-[var(--cream-dim)]"
                      }`}
                    >
                      {ing.inStock ? "In stock" : "Out of stock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.id)}
                      className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {isEditingStyles && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-[var(--cream-dim)]/10 pt-2">
                    {STYLE_TAGS.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleIngredientStyle(ing.id, ingStyles, style)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          ingStyles.includes(style)
                            ? "border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
                            : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
                        }`}
                      >
                        {STYLE_LABELS[style]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <SubstitutionManager />
      </section>
    </div>
  )
}
