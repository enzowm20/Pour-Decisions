import { useState } from "react"
import { useData } from "../context/DataContext"
import { getFlaggedMissingIngredients } from "../lib/flaggedIngredients"

export default function FlaggedIngredients() {
  const { recipes, substitutions, addSubstitution } = useData()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const flagged = getFlaggedMissingIngredients(recipes, substitutions)

  function handleSave(missingName: string) {
    const substitute = (drafts[missingName] ?? "").trim()
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
    <div className="mb-6">
      <p className="mb-1 text-sm font-medium">Flagged from venue scans</p>
      <p className="mb-3 text-xs text-[var(--cream-dim)]">
        Ingredients other venues' recipes call for that aren't in your stock. Type what you'd use
        instead and save — it adds a normal substitution rule, so this drops off the list once
        it's covered.
      </p>
      <div className="divide-y divide-[var(--cream-dim)]/15 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
        {flagged.map((name) => (
          <div key={name} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="text-sm">{name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--cream-dim)]">use instead</span>
              <input
                className="h-8 w-40 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-xs text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
                placeholder="What you have..."
                value={drafts[name] ?? ""}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [name]: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => handleSave(name)}
                className="h-8 rounded-md bg-[var(--primary)] px-2.5 text-xs font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
