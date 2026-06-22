// Client-side staff gate. There's no backend here, so this is a practical
// deterrent for a shared till/tablet — not real security. Anyone with dev
// tools open can clear sessionStorage or read the JS to bypass it. The
// password itself is never stored in plaintext (SHA-256 hash in
// localStorage), but that's a courtesy, not a defence against tampering.

const HASH_KEY = "staffPasswordHash"
const SESSION_KEY = "staffAuthed"

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function hasStaffPassword(): boolean {
  return localStorage.getItem(HASH_KEY) !== null
}

export async function setStaffPassword(password: string): Promise<void> {
  localStorage.setItem(HASH_KEY, await hashPassword(password))
}

export async function checkStaffPassword(password: string): Promise<boolean> {
  const stored = localStorage.getItem(HASH_KEY)
  if (!stored) return false
  return (await hashPassword(password)) === stored
}

export function isStaffAuthed(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1"
}

export function setStaffAuthed(): void {
  sessionStorage.setItem(SESSION_KEY, "1")
}

export function staffLogout(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
