import { useMemo, useState } from "react"
import { useData } from "../context/DataContext"
import { byName } from "../lib/sort"
import { CATEGORY_LABELS, type Ingredient } from "../types"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UsageEntry {
  id: string
  ingredientId: string
  amount: number
  unit: string // "bottles" | "ml" | "units" | any custom label
  date: string // ISO date YYYY-MM-DD
  note?: string
}

// ── Persistence ───────────────────────────────────────────────────────────────

function loadEntries(): UsageEntry[] {
  try { return JSON.parse(localStorage.getItem("stock-usage-log") ?? "[]") } catch { return [] }
}
function saveEntries(entries: UsageEntry[]) {
  localStorage.setItem("stock-usage-log", JSON.stringify(entries))
}
function newId() { return `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

// ── Period helpers ────────────────────────────────────────────────────────────

type Period = "week" | "fortnight" | "month"
const PERIOD_LABELS: Record<Period, string> = { week: "This week", fortnight: "Last 2 weeks", month: "This month" }

function periodStart(period: Period): Date {
  const now = new Date()
  if (period === "week") {
    const d = new Date(now); d.setDate(now.getDate() - 7); return d
  }
  if (period === "fortnight") {
    const d = new Date(now); d.setDate(now.getDate() - 14); return d
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

// ── Log usage modal ───────────────────────────────────────────────────────────

function LogModal({
  ingredient,
  onSave,
  onClose,
}: {
  ingredient: Ingredient
  onSave: (amount: number, unit: string, date: string, note: string) => void
  onClose: () => void
}) {
  const [amount, setAmount] = useState("")
  const [unit, setUnit] = useState("bottles")
  const [customUnit, setCustomUnit] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")

  const PRESET_UNITS = ["bottles", "ml", "units", "other…"]
  const isCustom = unit === "other…"
  const resolvedUnit = isCustom ? customUnit.trim() : unit

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(amount)
    if (!n || n <= 0 || !resolvedUnit) return
    onSave(n, resolvedUnit, date, note.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--cream-dim)]/20 bg-[var(--bg)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4 text-sm font-medium">Log usage — {ingredient.name}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              autoFocus
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 flex-1 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-9 rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-2 text-sm text-[var(--cream)]"
            >
              {PRESET_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {isCustom && (
            <input
              type="text"
              autoFocus
              placeholder="e.g. punnets, boxes, trays…"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              className="h-9 w-full rounded-md border border-[var(--gold)]/50 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
            />
          )}
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)] placeholder:text-[var(--cream-dim)]/60"
          />
          <div className="flex gap-2 pt-1">
            <button type="submit"
              className="h-9 flex-1 rounded-md bg-[var(--gold)] text-sm font-medium text-[var(--on-gold)] hover:opacity-90">
              Save
            </button>
            <button type="button" onClick={onClose}
              className="h-9 rounded-md border border-[var(--cream-dim)]/25 px-4 text-sm text-[var(--cream-dim)] hover:text-[var(--cream)]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UsageTracker() {
  const { ingredients } = useData()
  const [entries, setEntries] = useState<UsageEntry[]>(loadEntries)
  const [period, setPeriod] = useState<Period>("week")
  const [loggingFor, setLoggingFor] = useState<Ingredient | null>(null)
  const [viewCategory, setViewCategory] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── Derived: usage totals for current period ─────────────────────────────

  const cutoff = periodStart(period)

  const periodEntries = useMemo(
    () => entries.filter((e) => new Date(e.date) >= cutoff),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, period]
  )

  const totalsByIngredient = useMemo(() => {
    const map = new Map<string, Record<string, number>>()
    for (const e of periodEntries) {
      const cur = map.get(e.ingredientId) ?? {}
      cur[e.unit] = (cur[e.unit] ?? 0) + e.amount
      map.set(e.ingredientId, cur)
    }
    return map
  }, [periodEntries])

  function formatTotal(totals: Record<string, number>) {
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([unit, v]) => `${v} ${unit}`)
      .join(" + ") || "—"
  }

  // Sort ingredients: those with usage first, then alphabetically
  const filteredIngredients = useMemo(() => {
    const base = byName(
      viewCategory === "all"
        ? ingredients
        : ingredients.filter((i) => i.category === viewCategory)
    )
    return base.slice().sort((a, b) => {
      const aUsed = totalsByIngredient.has(a.id) ? 1 : 0
      const bUsed = totalsByIngredient.has(b.id) ? 1 : 0
      return bUsed - aUsed
    })
  }, [ingredients, viewCategory, totalsByIngredient])

  // Max bottle-equivalent for bar scaling (1 bottle = 700ml = 1 unit)
  const maxUsage = useMemo(() => {
    let max = 0
    for (const t of totalsByIngredient.values()) {
      const equiv = (t["bottles"] ?? 0) + (t["ml"] ?? 0) / 700 + (t["units"] ?? 0) + Object.entries(t).filter(([k]) => !["bottles","ml","units"].includes(k)).reduce((s,[,v]) => s + v, 0)
      if (equiv > max) max = equiv
    }
    return max || 1
  }, [totalsByIngredient])

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleSave(ingredient: Ingredient, amount: number, unit: string, date: string, note: string) {
    const entry: UsageEntry = {
      id: newId(),
      ingredientId: ingredient.id,
      amount,
      unit,
      note: note || undefined,
      date,
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    setLoggingFor(null)
  }

  function deleteEntry(id: string) {
    const updated = entries.filter((e) => e.id !== id)
    setEntries(updated)
    saveEntries(updated)
  }

  const categories = ["spirit", "mixer", "citrus", "sweetener", "fruit", "other"] as const

  return (
    <>
      {loggingFor && (
        <LogModal
          ingredient={loggingFor}
          onSave={(amount, unit, date, note) => handleSave(loggingFor, amount, unit, date, note)}
          onClose={() => setLoggingFor(null)}
        />
      )}

      {/* Period selector */}
      <div className="mb-5 flex items-center gap-3">
        <p className="text-sm font-medium">Period</p>
        <div className="flex gap-1">
          {(["week", "fortnight", "month"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                period === p
                  ? "bg-[var(--gold)] text-[var(--on-gold)]"
                  : "bg-[var(--surface-raised)] text-[var(--cream-dim)] hover:text-[var(--cream)]"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <p className="ml-auto text-xs text-[var(--cream-dim)]">
          {periodEntries.length} {periodEntries.length === 1 ? "entry" : "entries"} logged
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Ingredient rows */}
      <div className="divide-y divide-[var(--cream-dim)]/10 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)]">
        {filteredIngredients.length === 0 && (
          <p className="p-4 text-sm text-[var(--cream-dim)]">No ingredients yet.</p>
        )}
        {filteredIngredients.map((ing) => {
          const totals = totalsByIngredient.get(ing.id)
          const equiv = totals ? totals.bottles + totals.ml / 700 + totals.units : 0
          const barWidth = maxUsage > 0 ? Math.round((equiv / maxUsage) * 100) : 0
          const ingEntries = entries.filter((e) => e.ingredientId === ing.id)
          const isExpanded = expandedId === ing.id

          return (
            <div key={ing.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium">{ing.name}</p>
                    <p className="text-xs text-[var(--cream-dim)]">{CATEGORY_LABELS[ing.category]}</p>
                  </div>

                  {/* Usage bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--cream-dim)]/10">
                      <div
                        className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-[var(--cream-dim)]">
                      {totals ? formatTotal(totals) : "no usage logged"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {ingEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : ing.id)}
                      className="text-xs text-[var(--cream-dim)] hover:text-[var(--cream)]"
                    >
                      {isExpanded ? "Hide" : `History (${ingEntries.length})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLoggingFor(ing)}
                    className="h-7 rounded-md bg-[var(--gold)]/20 px-2 text-xs font-medium text-[var(--gold)] hover:bg-[var(--gold)]/30"
                  >
                    + Log
                  </button>
                </div>
              </div>

              {/* History */}
              {isExpanded && ingEntries.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-[var(--cream-dim)]/10 pt-2">
                  {ingEntries
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[var(--cream-dim)]">{entry.date}</span>
                        <span className="font-medium">{entry.amount} {entry.unit}</span>
                        {entry.note && <span className="flex-1 truncate text-[var(--cream-dim)]">{entry.note}</span>}
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-[var(--cream-dim)] hover:text-[var(--berry)]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
