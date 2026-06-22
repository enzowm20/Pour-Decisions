import { useState } from "react"
import { useData } from "../context/DataContext"
import { getFlaggedMissingIngredients } from "../lib/flaggedIngredients"
import { byName } from "../lib/sort"

export default function FlaggedIngredients() {
  const {
    recipes,
    substitutions,
    addSubstitution,
    ingredients,
    ignoredFlaggedIngredients,
    ignoreFlaggedIngredient,
    unignoreFlaggedIngredient,
  } = useData()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [showIgnored, setShowIgnored] = useState(false)

  const flagged = getFlaggedMissingIngredients(recipes, substitutions, ignoredFlaggedIngredients)
  const stockOptions = byName(ingredients)

  function handleSave(missingName: string) {
    const substitute = drafts[missingName]
    if (!substitute) return
    addSubstitution({ ingredientName: missingName, substituteName: substitute })
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[missingName]
      return next
    })
  }

  if (flagged.length === 0 && ignoredFlaggedIngredients.length === 0) return null

  return (
    <div className="mt-6">
      <p className="mb-1 text-sm font-medium">Flagged from venue scans</p>
      <p className="mb-3 text-xs text-[var(--cream-dim)]">
        Ingredients other venues' recipes call for that aren't in your stock. Pick what you'd use
        instead and save, or ignore it if you'd never stock it — either way it drops off this
        list.
      </p>

      {flagged.length > 0 && (
        <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
          {flagged.map((name) => (
            <div key={name} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <span className="text-sm">{name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--cream-dim)]">use instead</span>
                <select
                  className="h-8 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)]"
                  value={drafts[name] ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [name]: e.target.value }))}
                >
                  <option value="">Select from stock...</option>
                  {stockOptions.map((ing) => (
                    <option key={ing.id} value={ing.name}>
                      {ing.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleSave(name)}
                  disabled={!drafts[name]}
                  className="h-8 rounded-md bg-[var(--primary)] px-2.5 text-xs font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => ignoreFlaggedIngredient(name)}
                  className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {ignoredFlaggedIngredients.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowIgnored((prev) => !prev)}
            className="text-xs text-[var(--teal)] hover:underline"
          >
            {showIgnored ? "Hide" : "Show"} {ignoredFlaggedIngredients.length} ignored
          </button>
          {showIgnored && (
            <div className="mt-2 divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
              {byName(ignoredFlaggedIngredients.map((name) => ({ name }))).map(({ name }) => (
                <div key={name} className="flex items-center justify-between gap-2 p-3">
                  <span className="text-sm text-[var(--cream-dim)]">{name}</span>
                  <button
                    type="button"
                    onClick={() => unignoreFlaggedIngredient(name)}
                    className="text-xs text-[var(--teal)] hover:underline"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
