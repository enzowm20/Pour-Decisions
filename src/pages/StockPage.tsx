import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import FallingBottles from "../components/FallingBottles"
import RevealOnScroll from "../components/RevealOnScroll"
import ConfirmButton from "../components/ConfirmButton"
import aperolBottle from "../assets/aperol-bottle.webp"
import {
  CATEGORY_LABELS,
  FLAVOR_TAGS,
  STYLE_LABELS,
  STYLE_TAGS,
  type FlavorTag,
  type Ingredient,
  type IngredientCategory,
  type StyleTag,
} from "../types"

const categories: IngredientCategory[] = ["spirit", "mixer", "citrus", "sweetener", "fruit", "other"]

// Sub-groups within the Spirit category, in display order. Matched by
// keyword against the ingredient name — no extra field to maintain, but it's
// a heuristic, so anything that doesn't match a known keyword lands in
// "Other Spirit" rather than guessing wrong.
const SPIRIT_GROUPS: { label: string; match: (name: string) => boolean }[] = [
  { label: "Vodka", match: (n) => n.includes("vodka") },
  { label: "Gin", match: (n) => n.includes("gin") },
  { label: "Rum", match: (n) => n.includes("rum") },
  { label: "Tequila & Mezcal", match: (n) => n.includes("tequila") || n.includes("mezcal") },
  {
    label: "Whiskey",
    match: (n) => n.includes("whiskey") || n.includes("whisky") || n.includes("bourbon") || n.includes("scotch"),
  },
  { label: "Brandy & Cognac", match: (n) => n.includes("brandy") || n.includes("cognac") },
  {
    label: "Liqueur",
    match: (n) =>
      n.includes("liqueur") ||
      n.includes("schnapps") ||
      n.includes("amaretto") ||
      n.includes("cointreau") ||
      n.includes("chambord") ||
      n.includes("kahlua") ||
      n.includes("baileys") ||
      n.includes("triple sec") ||
      n.includes("curacao") ||
      n.includes("limoncello") ||
      n.includes("vermouth") ||
      n.includes("campari") ||
      n.includes("aperol") ||
      n.includes("elderflower") ||
      n.includes("de kyper") ||
      n.includes("passionfruit") ||
      n.includes("paraiso"),
  },
]

function spiritGroupLabel(name: string): string {
  const lower = name.toLowerCase()
  return SPIRIT_GROUPS.find((g) => g.match(lower))?.label ?? "Other Spirit"
}

function groupSpirits(spirits: Ingredient[]): { label: string; items: Ingredient[] }[] {
  const byGroup = new Map<string, Ingredient[]>()
  for (const ing of spirits) {
    const label = spiritGroupLabel(ing.name)
    if (!byGroup.has(label)) byGroup.set(label, [])
    byGroup.get(label)!.push(ing)
  }
  const order = [...SPIRIT_GROUPS.map((g) => g.label), "Other Spirit"]
  return order
    .filter((label) => byGroup.has(label))
    .map((label) => ({ label, items: byGroup.get(label)! }))
}

export default function StockPage() {
  const { ingredients, addIngredient, updateIngredient, removeIngredient, locked } = useData()

  // Arriving from a flagged venue-scan ingredient's "Purchase" button —
  // prefill the add form with that name so the user just fills in the rest.
  const [searchParams] = useSearchParams()
  const [name, setName] = useState(searchParams.get("add") ?? "")
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

  const spiritGroups = useMemo(
    () => (viewCategory === "spirit" ? groupSpirits(visibleIngredients) : null),
    [viewCategory, visibleIngredients],
  )

  const inputClass =
    "h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
  const buttonClass =
    "h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"

  function renderIngredientRow(ing: Ingredient) {
    const ingStyles = ing.styles ?? []
    const isEditingStyles = editingStylesId === ing.id
    return (
      <div key={ing.id} className="p-3">
        <div className="flex flex-nowrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{ing.name}</p>
            <p className="text-xs text-[var(--cream-dim)]">
              {CATEGORY_LABELS[ing.category]}
              {ing.tags.length > 0 ? ` · ${[...ing.tags].sort().join(", ")}` : ""}
              {ingStyles.length > 0
                ? ` · ${ingStyles.map((s) => STYLE_LABELS[s]).sort().join(", ")}`
                : ""}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-nowrap items-center gap-3 whitespace-nowrap">
            <button
              type="button"
              disabled={locked}
              onClick={() => setEditingStylesId(isEditingStyles ? null : ing.id)}
              className="text-xs text-[var(--teal)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditingStyles ? "Done" : "Edit style"}
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--cream-dim)]">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={locked}
                title="Cost per serving (30ml) — what you paid for it"
                className="h-7 w-16 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-1.5 text-xs text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={locked}
              onClick={() => updateIngredient(ing.id, { inStock: !ing.inStock })}
              className={`rounded-full px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                ing.inStock
                  ? "bg-[var(--sage)] text-[var(--on-sage)]"
                  : "bg-[var(--bg)] text-[var(--cream-dim)]"
              }`}
            >
              {ing.inStock ? "In stock" : "Out of stock"}
            </button>
            <ConfirmButton
              disabled={locked}
              onConfirm={() => removeIngredient(ing.id)}
              label="Remove"
              className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
              confirmClassName="text-xs font-medium text-[var(--berry)]"
            />
          </div>
        </div>
        {isEditingStyles && (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-[var(--cream-dim)]/10 pt-2">
            {STYLE_TAGS.map((style) => (
              <button
                key={style}
                type="button"
                disabled={locked}
                onClick={() => toggleIngredientStyle(ing.id, ingStyles, style)}
                className={`rounded-full border px-3 py-1 text-xs tag-glow disabled:cursor-not-allowed disabled:opacity-50 ${
                  ingStyles.includes(style)
                    ? "tag-glow-on border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
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
  }

  return (
    <div className="relative space-y-8">
      <FallingBottles bottleImg={aperolBottle} />
      <RevealOnScroll>
        <h1 className="mb-1 text-lg font-medium">Your Stock</h1>
        <p className="mb-4 text-sm text-[var(--cream-dim)]">
          Add every ingredient you carry. Toggle in/out of stock as it runs out. Cost per serving
          assumes a standard 30ml pour.
        </p>

        {/* fieldset disabled natively disables every nested input/select/
            button in one go — much more reliable than remembering to
            annotate each control individually, and the "contents" display
            keeps it from affecting layout at all. */}
        <fieldset disabled={locked} className="contents">
          <form onSubmit={handleAddIngredient} className="mb-4 flex flex-wrap items-end gap-2">
            <input
              className={`${inputClass} flex-1 min-w-[160px] disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="Ingredient name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className={`${inputClass} px-2 disabled:cursor-not-allowed disabled:opacity-50`}
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
              className={`${inputClass} w-32 disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="Cost / serving (30ml)"
              value={costPerServing}
              onChange={(e) => setCostPerServing(e.target.value)}
            />
            <button type="submit" className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}>
              Add ingredient
            </button>
          </form>

          <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Flavour Profile</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {FLAVOR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs tag-glow disabled:cursor-not-allowed disabled:opacity-50 ${
                  tags.includes(tag)
                    ? "tag-glow-on border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                    : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs text-[var(--cream-dim)]">Cocktail Style</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {STYLE_TAGS.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`rounded-full border px-3 py-1 text-xs tag-glow disabled:cursor-not-allowed disabled:opacity-50 ${
                  styles.includes(style)
                    ? "tag-glow-on border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
                    : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
                }`}
              >
                {STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        </fieldset>

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

        {spiritGroups ? (
          <div className="space-y-4">
            {spiritGroups.length === 0 && (
              <p className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4 text-sm text-[var(--cream-dim)]">
                No spirits yet.
              </p>
            )}
            {spiritGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-xs font-medium text-[var(--cream-dim)]">{group.label}</p>
                <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
                  {group.items.map(renderIngredientRow)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
            {visibleIngredients.length === 0 && (
              <p className="p-4 text-sm text-[var(--cream-dim)]">No ingredients in this category yet.</p>
            )}
            {visibleIngredients.map(renderIngredientRow)}
          </div>
        )}
      </RevealOnScroll>
    </div>
  )
}
