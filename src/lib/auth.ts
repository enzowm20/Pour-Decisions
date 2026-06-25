// Client-side staff gate. There's no backend auth here, so this is a
// practical deterrent for casual visitors of the public site — not real
// security. Anyone with dev tools open can read the JS bundle or call the
// Supabase API directly with the public anon key, bypassing this entirely.
// The password itself isn't compared in plaintext (SHA-256 hash, hardcoded
// below), but that's a courtesy against a quick text-search of the bundle,
// not a defence against tampering.

const SESSION_KEY = "staffAuthed"

// SHA-256("pourdecisions!") — the one staff password for every user/device,
// now that the site is public rather than set up per-device.
const STAFF_PASSWORD_HASH = "5fbe90035e02e8bd6381eb475c33f15ec49c1dec81097947a1e046333fbd0138"

// SHA-256("201203") — the single code used to both lock and unlock the site.
const LOCK_CODE_HASH = "d3a7b43aa37fa307825752a71f281016605062f0d3ad8f212321fe933a5fc672"

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function checkStaffPassword(password: string): Promise<boolean> {
  return (await sha256(password)) === STAFF_PASSWORD_HASH
}

export async function checkLockCode(code: string): Promise<boolean> {
  return (await sha256(code)) === LOCK_CODE_HASH
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
