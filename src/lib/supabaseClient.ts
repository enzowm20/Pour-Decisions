import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in .env.local (and in your Vercel project's Environment Variables for the deployed site).",
  )
}

export const supabase = createClient(url, anonKey)

// Public bucket all photo uploads live in — created once via the Supabase
// dashboard (Storage → New bucket, Public). Bucket names are case-sensitive
// in Supabase's API, so this has to match exactly what was created. Files
// are organized as <bucket>/<table>/<rowId>/<n>.jpg.
export const PHOTOS_BUCKET = "Photos"
