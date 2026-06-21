import type { Ingredient } from "../types"
import { byName } from "../lib/sort"

interface Props {
  ingredients: Ingredient[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

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
    <div className="flex flex-wrap gap-2">
      {byName(ingredients).map((ing) => (
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
  )
}
