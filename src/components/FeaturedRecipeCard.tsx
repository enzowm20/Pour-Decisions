interface RecipeIngredient {
  amount: string
  item: string
  note?: string
}

interface MenuRecipe {
  id: string
  name: string
  baseSpirit?: string | null
  format?: string | null
  ingredients: RecipeIngredient[]
  method: string
  glass: string
  ice?: string
  garnish?: string
}

interface Props {
  recipe: MenuRecipe
  onTry?: () => void
}

export default function FeaturedRecipeCard({ recipe, onTry }: Props) {
  return (
    <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--surface-raised)] p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{recipe.name}</p>
        <span className="shrink-0 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-xs text-[var(--gold)]">
          Featured recipe
        </span>
      </div>

      {recipe.format && (
        <p className="mb-3 text-xs text-[var(--cream-dim)]">{recipe.format}</p>
      )}

      <ul className="mb-3 space-y-0.5">
        {recipe.ingredients.map((ing, i) => (
          <li key={i} className="flex gap-2 text-xs">
            <span className="w-14 shrink-0 text-[var(--cream-dim)]">{ing.amount}</span>
            <span>
              {ing.item}
              {ing.note && <span className="text-[var(--cream-dim)]"> ({ing.note})</span>}
            </span>
          </li>
        ))}
      </ul>

      <p className="mb-2 text-xs text-[var(--cream-dim)]">{recipe.method}</p>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--cream-dim)]">
        <span>Glass: <span className="text-[var(--cream)]">{recipe.glass}</span></span>
        {recipe.ice && <span>Ice: <span className="text-[var(--cream)]">{recipe.ice}</span></span>}
        {recipe.garnish && <span>Garnish: <span className="text-[var(--cream)]">{recipe.garnish}</span></span>}
      </div>

      {onTry && (
        <button
          type="button"
          onClick={onTry}
          className="mt-3 h-8 rounded-md bg-[var(--gold)] px-3 text-sm font-medium text-[var(--on-gold)] hover:opacity-90"
        >
          Log this
        </button>
      )}
    </div>
  )
}
