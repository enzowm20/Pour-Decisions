import { useState } from "react"
import { Outlet } from "react-router-dom"
import { checkStaffPassword, hasStaffPassword, isStaffAuthed, setStaffAuthed, setStaffPassword } from "../lib/auth"

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
    <div className="flex min-h-screen items-center justify-center bg-[#0f2240] px-4">
      <form
        onSubmit={hasPassword ? handleLogin : handleSetup}
        className="w-full max-w-sm space-y-3 rounded-lg border border-white/15 bg-[#1b3a6b] p-6"
      >
        <p className="text-base font-medium text-[#fbf3e4]">
          {hasPassword ? "Staff sign-in" : "Set a staff password"}
        </p>
        <p className="text-sm text-[#c9beb1]">
          {hasPassword
            ? "This area is for you and your staff only."
            : "Nobody's set one up on this device yet. Choose a password staff will use to get in."}
        </p>

        <input
          type="password"
          autoFocus
          className="h-9 w-full rounded-md border border-white/20 bg-[#0f2240] px-3 text-sm text-[#fbf3e4]"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!hasPassword && (
          <input
            type="password"
            className="h-9 w-full rounded-md border border-white/20 bg-[#0f2240] px-3 text-sm text-[#fbf3e4]"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}

        {error && <p className="text-xs text-[#f28095]">{error}</p>}

        <button
          type="submit"
          className="h-9 w-full rounded-md bg-[#e8531b] text-sm font-medium text-[#fbf3e4] hover:bg-[#ffb400]"
        >
          {hasPassword ? "Sign in" : "Set password and continue"}
        </button>

        {hasPassword && (
          <p className="text-xs text-[#c9beb1]">
            Forgotten it? Clear this site's local storage in your browser to reset and set a new
            one — that also resets all your stock, archive, and menu data on this device.
          </p>
        )}
      </form>
    </div>
  )
}
