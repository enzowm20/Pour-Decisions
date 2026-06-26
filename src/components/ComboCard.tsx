import RevealOnScroll from "./RevealOnScroll"
import type { Combo } from "../lib/comboGenerator"
import type { IngredientCategory } from "../types"

const LABELS: Record<IngredientCategory, string> = {
  spirit: "Spirits",
  mixer: "Mixers",
  citrus: "Citrus",
  sweetener: "Sweeteners",
  fruit: "Fruit",
  other: "Top-up",
}

const DISPLAY_ORDER: IngredientCategory[] = ["spirit", "mixer", "citrus", "sweetener", "fruit", "other"]

interface Props {
  combo: Combo
  tags: string[]
  onTry: () => void
  // Shown next to the tags instead of (or alongside) them — used by the
  // random-cocktail button to surface its rough match-confidence score.
  badge?: string
}

// Shared by every place on the Experiment Lab page that shows a generated
// combo — the flavour-profile picker, the occasion planner, and the random
// button all render results identically, just with different tag chips/an
// optional badge.
export default function ComboCard({ combo, tags, onTry, badge }: Props) {
  const presentCategories = DISPLAY_ORDER.filter((c) => (combo.bySlot[c] ?? []).length > 0)
  return (
    <RevealOnScroll className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4">
      <div className="mb-3 flex flex-wrap gap-4">
        {presentCategories.map((category) => (
          <div key={category}>
            <p className="text-[11px] text-[var(--cream-dim)]">{LABELS[category]}</p>
            <ul className="text-sm">
              {(combo.bySlot[category] ?? []).map((ing) => (
                <li key={ing.id}>
                  {ing.name}
                  {combo.learnedIds.has(ing.id) && (
                    <span className="ml-1.5 rounded-full bg-[var(--sage)]/20 px-1.5 py-0.5 text-[10px] text-[var(--sage)]">
                      proven
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {badge && (
            <span className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--teal)]">
              {badge}
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[11px] text-[var(--gold)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onTry}
          className="h-8 flex-shrink-0 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90"
        >
          Try this
        </button>
      </div>
    </RevealOnScroll>
  )
}
