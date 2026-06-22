import { useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"

export default function SubstitutionManager() {
  const { ingredients, substitutions, addSubstitution, removeSubstitution } = useData()

  const [subIngredientName, setSubIngredientName] = useState("")
  const [subSubstituteName, setSubSubstituteName] = useState("")
  const [subError, setSubError] = useState("")

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

  const inputClass =
    "h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60 min-w-[160px]"

  return (
    <div>
      <h2 className="mb-1 text-base font-medium">Substitutions</h2>
      <p className="mb-3 text-sm text-[var(--cream-dim)]">
        When an ingredient is missing, the app checks this table for a known stand-in — e.g. no
        Jägermeister in stock, use something you actually have instead.
      </p>

      <datalist id="ingredient-names">
        {byName(ingredients).map((i) => (
          <option key={i.id} value={i.name} />
        ))}
      </datalist>

      <form onSubmit={handleAddSubstitution} className="mb-2 flex flex-wrap items-end gap-2">
        <input
          list="ingredient-names"
          className={inputClass}
          placeholder="Missing ingredient..."
          value={subIngredientName}
          onChange={(e) => setSubIngredientName(e.target.value)}
        />
        <span className="text-sm text-[var(--cream-dim)]">use instead</span>
        <input
          list="ingredient-names"
          className={inputClass}
          placeholder="Substitute..."
          value={subSubstituteName}
          onChange={(e) => setSubSubstituteName(e.target.value)}
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
        >
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
    </div>
  )
}
