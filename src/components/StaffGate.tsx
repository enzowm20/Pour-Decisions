import { useState } from "react"
import { Outlet } from "react-router-dom"
import { checkStaffPassword, isStaffAuthed, setStaffAuthed } from "../lib/auth"
import DrainingBackground from "./DrainingBackground"
import FallingBottles from "./FallingBottles"
import logoLimoncelloHero from "../assets/logo-limoncello-hero.png"
import limoncelloBottle from "../assets/limoncello-bottle.webp"

export default function StaffGate() {
  const [authed, setAuthed] = useState(isStaffAuthed())
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  if (authed) return <Outlet />

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const ok = await checkStaffPassword(password)
    if (!ok) {
      setError("Wrong password.")
      return
    }
    setStaffAuthed()
    setAuthed(true)
  }

  return (
    // Same limoncello theme, draining background, and falling bottles as the
    // home page itself — once the password's entered, this hands off into
    // the exact same backdrop rather than cutting from a plain login box to
    // a completely different-looking page.
    <div className="theme-limoncello relative flex min-h-screen items-center justify-center px-4 text-center text-[var(--cream)]">
      <DrainingBackground />
      <FallingBottles bottleImg={limoncelloBottle} />

      {/* One backdrop panel sized to fit its widest child (the logo) via
          w-fit, rather than a fixed max-w-sm that would crop/condense it —
          the panel's bounds always extend out to the logo's actual edges.
          The limoncello theme's yellow liquid was making the logo hard to
          see with no backdrop at all behind it; this puts the same opaque
          surface behind both the logo and the form, not just the form. */}
      <div className="relative flex w-fit max-w-full flex-col items-center gap-6 rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-6">
        <img
          src={logoLimoncelloHero}
          alt="Pour Decisions — match, mix, sip"
          className="h-56 w-auto sm:h-80 md:h-96"
        />

        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3 text-left">
          <p className="text-base font-medium text-[var(--cream)]">Staff sign-in</p>
          <p className="text-sm text-[var(--cream-dim)]">This area is for you and your staff only.</p>
          <p className="text-xs text-[var(--cream-dim)]/70">
            Hint: the name of this app, all lowercase and one word, with some enthusiasm at the end.
          </p>

          <input
            type="password"
            autoFocus
            className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-xs text-[var(--berry)]">{error}</p>}

          <button
            type="submit"
            className="h-9 w-full rounded-md bg-[var(--primary)] text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
