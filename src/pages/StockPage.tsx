import { useMemo, useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
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
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    substitutions,
    addSubstitution,
    removeSubstitution,
  } = useData()

  const [name, setName] = useState("")
  const [category, setCategory] = useState<IngredientCategory>("spirit")
  const [tags, setTags] = useState<FlavorTag[]>([])
  const [styles, setStyles] = useState<StyleTag[]>([])

  const [viewCategory, setViewCategory] = useState<IngredientCategory | "all">("all")
  const [editingStylesId, setEditingStylesId] = useState<string | null>(null)

  const [subIngredientName, setSubIngredientName] = useState("")
  const [subSubstituteName, setSubSubstituteName] = useState("")
  const [subError, setSubError] = useState("")

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
    addIngredient({ name: name.trim(), category, tags, styles, inStock: true })
    setName("")
    setTags([])
    setStyles([])
  }

  function handleAddSubstitution(e: React.FormEvent) {
    e.preventDefault()
    const missing = subIngredientName.trim()
    const substitute = subSubstituteName.trim()

    if (!missing || !substitute) {
      setSubError("Enter both a missing ingredient and a substitute.")
      return
    }
    if (missing.toLowerCase() === substitute.toLowerCase()) {
      setSubError("Enter two different ingredients.")
      return
    }

    addSubstitution({ ingredientName: missing, substituteName: substitute })
    setSubIngredientName("")
    setSubSubstituteName("")
    setSubError("")
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
        <h2 className="mb-1 text-base font-medium">Substitutions</h2>
        <p className="mb-3 text-sm text-[var(--cream-dim)]">
          When an ingredient is missing, the app checks this table for a known stand-in.
        </p>

        <datalist id="ingredient-names">
          {byName(ingredients).map((i) => (
            <option key={i.id} value={i.name} />
          ))}
        </datalist>

        <form onSubmit={handleAddSubstitution} className="mb-2 flex flex-wrap items-end gap-2">
          <input
            list="ingredient-names"
            className={`${inputClass} min-w-[160px]`}
            placeholder="Missing ingredient..."
            value={subIngredientName}
            onChange={(e) => setSubIngredientName(e.target.value)}
          />
          <span className="text-sm text-[var(--cream-dim)]">use instead</span>
          <input
            list="ingredient-names"
            className={`${inputClass} min-w-[160px]`}
            placeholder="Substitute..."
            value={subSubstituteName}
            onChange={(e) => setSubSubstituteName(e.target.value)}
          />
          <button type="submit" className={buttonClass}>
            Add rule
          </button>
        </form>

        {subError && <p className="mb-4 text-xs text-[var(--berry)]">{subError}</p>}

        <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
          {substitutions.length === 0 && (
            <p className="p-4 text-sm text-[var(--cream-dim)]">No substitution rules yet.</p>
          )}
          {[...substitutions]
            .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
            .map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-3 text-sm">
              <span>
                {sub.ingredientName} →{" "}
                <span className="font-medium">{sub.substituteName}</span>
              </span>
              <button
                type="button"
                onClick={() => removeSubstitution(sub.id)}
                className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
