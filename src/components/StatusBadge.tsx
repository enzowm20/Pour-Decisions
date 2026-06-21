import type { RecipeStatus } from "../types"

const styles: Record<RecipeStatus, string> = {
  makeable: "bg-[var(--sage)] text-[var(--on-sage)]",
  substitute: "bg-[var(--gold)] text-[var(--on-gold)]",
  purchase: "bg-[var(--berry)] text-[var(--on-berry)]",
}

const labels: Record<RecipeStatus, string> = {
  makeable: "We can make this",
  substitute: "Swap needed",
  purchase: "Needs purchase",
}

export default function StatusBadge({ status }: { status: RecipeStatus }) {
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
