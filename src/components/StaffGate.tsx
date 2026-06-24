import { useState } from "react"
import { Outlet } from "react-router-dom"
import { checkStaffPassword, hasStaffPassword, isStaffAuthed, setStaffAuthed, setStaffPassword } from "../lib/auth"
import DrainingBackground from "./DrainingBackground"
import FallingBottles from "./FallingBottles"
import logoLimoncelloHero from "../assets/logo-limoncello-hero.png"
import limoncelloBottle from "../assets/limoncello-bottle.webp"

export default function StaffGate() {
  const [authed, setAuthed] = useState(isStaffAuthed())
  const [hasPassword, setHasPassword] = useState(hasStaffPassword())
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  if (authed) return <Outlet />

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 4) {
      setError("Use at least 4 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    await setStaffPassword(password)
    setStaffAuthed()
    setHasPassword(true)
    setAuthed(true)
  }

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

        <form
          onSubmit={hasPassword ? handleLogin : handleSetup}
          className="w-full max-w-sm space-y-3 text-left"
        >
          <p className="text-base font-medium text-[var(--cream)]">
            {hasPassword ? "Staff sign-in" : "Set a staff password"}
          </p>
          <p className="text-sm text-[var(--cream-dim)]">
            {hasPassword
              ? "This area is for you and your staff only."
              : "Nobody's set one up on this device yet. Choose a password staff will use to get in."}
          </p>

          <input
            type="password"
            autoFocus
            className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!hasPassword && (
            <input
              type="password"
              className="h-9 w-full rounded-md border border-[var(--cream-dim)]/25 bg-[var(--bg)] px-3 text-sm text-[var(--cream)]"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          {error && <p className="text-xs text-[var(--berry)]">{error}</p>}

          <button
            type="submit"
            className="h-9 w-full rounded-md bg-[var(--primary)] text-sm font-medium text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
          >
            {hasPassword ? "Sign in" : "Set password and continue"}
          </button>

          {hasPassword && (
            <p className="text-xs text-[var(--cream-dim)]">
              Forgotten it? Clear this site's local storage in your browser to reset and set a new
              one — that also resets all your stock, archive, and menu data on this device.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
