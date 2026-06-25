import { useState } from "react"
import { useData } from "../context/DataContext"
import { checkLockCode } from "../lib/auth"

// Open padlock: shackle drawn open/offset to one side. Closed padlock:
// shackle drawn as a closed loop over the body. Same body shape for both so
// the icon doesn't jump around when it switches.
function PadlockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      {locked ? (
        <path
          d="M7 10V7a5 5 0 0 1 10 0v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M7 10V7a5 5 0 0 1 9.5-2.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function SiteLockControl() {
  const { locked, setLocked } = useData()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  function closeModal() {
    setOpen(false)
    setCode("")
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await checkLockCode(code)
    if (!ok) {
      setError("Wrong code.")
      return
    }
    setLocked(!locked)
    closeModal()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={locked ? "Site is locked — tap to unlock" : "Tap to lock the site (read-only)"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          locked
            ? "border-[var(--berry)]/50 bg-[var(--berry)]/15 text-[var(--berry)]"
            : "border-[var(--cream-dim)]/25 text-[var(--surface)] hover:bg-[var(--cream-dim)]/20"
        }`}
      >
        <PadlockIcon locked={locked} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-xs space-y-3 rounded-lg border border-[var(--cream-dim)]/20 bg-[var(--cream)] p-5 text-[var(--surface)]"
          >
            <p className="text-sm font-medium">{locked ? "Unlock the site" : "Lock the site"}</p>
            <p className="text-xs text-[var(--cream-dim)]">
              {locked
                ? "Enter the code to resume adding, editing, and deleting."
                : "Enter the code to make the site view-only for everyone — nothing can be added, edited, or deleted until it's unlocked again."}
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className="h-9 w-full rounded-md border border-[var(--cream-dim)]/40 bg-white px-3 text-center text-sm tracking-widest"
            />
            {error && <p className="text-xs text-[var(--berry)]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-9 flex-1 rounded-md border border-[var(--cream-dim)]/40 text-sm hover:bg-[var(--cream-dim)]/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 flex-1 rounded-md bg-[var(--primary)] text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
              >
                {locked ? "Unlock" : "Lock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
