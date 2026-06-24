import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// One-time, manual local-storage -> Supabase migration. Exposes
// window.migrateLocalDataToSupabase() in the console; never runs on its own.
import './lib/migrateLocalData.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
