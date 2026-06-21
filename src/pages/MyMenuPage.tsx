import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { checkRecipe } from "../lib/recipeCheck"
import StatusBadge from "../components/StatusBadge"

export default function MyMenuPage() {
  const { recipes, removeRecipe, ingredients, substitutions } = useData()

  const menuRecipes = byName(recipes.filter((r) => r.venueId === null))
  const byId = new Map(ingredients.map((i) => [i.id, i]))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mb-1 text-lg font-medium">My Menu</h1>
        <p className="text-sm text-[var(--cream-dim)]">
          Cocktails you've promoted from the Archive. Tap "Add to my menu" on a successful
          experiment to land it here.
        </p>
      </div>

      <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
        {menuRecipes.length === 0 && (
          <p className="p-4 text-sm text-[var(--cream-dim)]">
            Nothing on your menu yet — promote a successful experiment from the Archive.
          </p>
        )}
        {menuRecipes.map((recipe) => {
          const result = checkRecipe(recipe, ingredients, substitutions)
          return (
            <div key={recipe.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
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
                <button
                  type="button"
                  onClick={() => removeRecipe(recipe.id)}
                  className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
