import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../context/DataContext"
import { getFlaggedMissingIngredients } from "../lib/flaggedIngredients"
import { byName } from "../lib/sort"
import ConfirmButton from "./ConfirmButton"

export default function FlaggedIngredients() {
  const { recipes, substitutions, addSubstitution, ingredients, deleteFlaggedIngredientName } = useData()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState(false)

  const flagged = getFlaggedMissingIngredients(recipes, substitutions, ingredients)
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

  if (flagged.length === 0) return null

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mb-1 flex w-full items-center gap-1.5 text-left text-sm font-medium"
      >
        <span className={`text-[var(--cream-dim)] transition-transform ${expanded ? "rotate-90" : ""}`}>›</span>
        Flagged From Venue Scans ({flagged.length})
      </button>
      {!expanded && (
        <p className="text-xs text-[var(--cream-dim)]">
          {flagged.length} ingredient{flagged.length === 1 ? "" : "s"} need a substitution or a
          decision — click to review.
        </p>
      )}
      {expanded && (
        <>
          <p className="mb-3 text-xs text-[var(--cream-dim)]">
            Ingredients other venues' recipes call for that aren't in your stock. Pick what you'd
            use instead and save, or delete it outright if you'd never stock it.
          </p>
          <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
            {flagged.map((name) => (
              <div key={name} className="flex items-start justify-between gap-3 p-3">
                <span className="min-w-0 flex-1 text-sm">{name}</span>
                <div className="flex flex-shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap">
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
                    onClick={() => navigate(`/stock?add=${encodeURIComponent(name)}`)}
                    className="h-8 rounded-md border border-[var(--teal)]/40 px-2.5 text-xs font-medium text-[var(--teal)] hover:bg-[var(--teal)]/10"
                    title="Decide to stock this — opens the stock page to fill in its details"
                  >
                    Purchase
                  </button>
                  <ConfirmButton
                    onConfirm={() => deleteFlaggedIngredientName(name)}
                    label="Delete"
                    className="text-xs text-[var(--cream-dim)] hover:text-[var(--berry)]"
                    confirmClassName="text-xs font-medium text-[var(--berry)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
