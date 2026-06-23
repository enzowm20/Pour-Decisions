import type { Ingredient, IngredientCategory } from "../types"
import { CATEGORY_LABELS } from "../types"
import { byName } from "../lib/sort"

interface Props {
  ingredients: Ingredient[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

const CATEGORY_ORDER: IngredientCategory[] = ["spirit", "mixer", "citrus", "sweetener", "fruit", "other"]

export default function IngredientPicker({ ingredients, selectedIds, onChange }: Props) {
  function toggle(id: string) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id],
    )
  }

  if (ingredients.length === 0) {
    return <p className="text-sm text-[var(--cream-dim)]">Add ingredients to your stock first.</p>
  }

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((category) => {
        const items = byName(ingredients.filter((i) => i.category === category))
        if (items.length === 0) return null
        return (
          <div key={category}>
            <p className="mb-1.5 text-[11px] text-[var(--cream-dim)]">{CATEGORY_LABELS[category]}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggle(ing.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedIds.includes(ing.id)
                      ? "border-[var(--teal)] bg-[var(--teal)] text-[var(--on-teal)]"
                      : "border-[var(--cream-dim)]/25 text-[var(--cream-dim)]"
                  }`}
                >
                  {ing.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
