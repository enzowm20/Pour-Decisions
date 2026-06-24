import { useState } from "react"

interface Props {
  onConfirm: () => void
  label: string
  className?: string
  // Applied instead of `className` once a confirmation step is showing —
  // lets callers swap in a "this is now serious" color (e.g. berry/red)
  // without needing two separate buttons.
  confirmClassName?: string
}

// Two sequential confirmations before anything irreversible happens. First
// click arms it ("Are you sure?"); a second click while still armed escalates
// ("Are you VERY sure?"); only a third click actually fires onConfirm. Losing
// focus (clicking/tapping anywhere else) disarms it, so a destructive action
// can never sit "half-confirmed" waiting for an unrelated later tap to land
// on it by accident.
export default function ConfirmButton({ onConfirm, label, className, confirmClassName }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0)

  function handleClick() {
    if (step === 2) {
      onConfirm()
      setStep(0)
    } else {
      setStep((s) => (s + 1) as 0 | 1 | 2)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setStep(0)}
      className={step > 0 ? (confirmClassName ?? className) : className}
    >
      {step === 0 ? label : step === 1 ? "Are you sure?" : "Are you VERY sure?"}
    </button>
  )
}
