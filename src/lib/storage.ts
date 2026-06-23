import { useEffect, useState } from "react"

export function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key)
    if (!raw) return initial
    try {
      return JSON.parse(raw) as T
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (err) {
      // Almost always a QuotaExceededError — base64 photos are by far the
      // biggest thing we store, and browsers cap localStorage at ~5MB. This
      // write runs in an effect during commit; letting it throw would unmount
      // the whole app and leave a blank page. Swallow it so the app keeps
      // running on whatever was last persisted; the in-memory state is still
      // correct for this session.
      console.warn(
        `Couldn't save "${key}" to localStorage (likely out of space — too many/too-large photos).`,
        err,
      )
    }
  }, [key, state])

  return [state, setState] as const
}

// Like useLocalStorageState, but for arrays of entities that carry a
// `photos: string[]` field which can be large. The structural data (tiny) and
// the photo blobs (potentially megabytes) are persisted to SEPARATE
// localStorage keys, and written in two independent try/catch blocks. So if
// the photo write ever exceeds the quota, only photos are dropped — the
// entries themselves are ALWAYS saved. This is what stops freshly entered
// venue scans from vanishing on refresh when storage is tight.
//
// Backwards compatible: legacy data stored the photos inline under `key`, so
// the first load reads them from there; the next save splits them out and
// shrinks the structural key, freeing space.
export function usePhotoSplitState<T extends { id: string; photos: string[] }>(key: string, initial: T[]) {
  const photoKey = `${key}:photos`
  const [state, setState] = useState<T[]>(() => {
    try {
      const metaRaw = localStorage.getItem(key)
      const meta: T[] = metaRaw ? (JSON.parse(metaRaw) as T[]) : initial
      const photosRaw = localStorage.getItem(photoKey)
      const photos: Record<string, string[]> = photosRaw ? JSON.parse(photosRaw) : {}
      return meta.map((e) => ({ ...e, photos: photos[e.id] ?? e.photos ?? [] }))
    } catch {
      return initial
    }
  })

  useEffect(() => {
    // Structural data without photos — small, must always persist.
    try {
      const meta = state.map((e) => ({ ...e, photos: [] as string[] }))
      localStorage.setItem(key, JSON.stringify(meta))
    } catch (err) {
      console.warn(`Couldn't save "${key}" entries to localStorage.`, err)
    }
    // Photos — may exceed quota; if so only photos are lost, never entries.
    try {
      const photos: Record<string, string[]> = {}
      for (const e of state) if (e.photos?.length) photos[e.id] = e.photos
      localStorage.setItem(photoKey, JSON.stringify(photos))
    } catch (err) {
      console.warn(`Couldn't save "${key}" photos to localStorage (out of space).`, err)
    }
  }, [key, photoKey, state])

  return [state, setState] as const
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Re-encode an already-stored data URL down to a small JPEG. Used by the
// startup migration to shrink photos saved before compression existed —
// those oversized blobs fill the localStorage quota, which then silently
// blocks ALL subsequent writes (so freshly entered scans vanish on refresh).
export function compressDataUrl(dataUrl: string, maxEdge = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image/")) {
      resolve(dataUrl)
      return
    }
    const img = new Image()
    img.onerror = () => resolve(dataUrl)
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.src = dataUrl
  })
}

// Downscale + re-encode an image to a small JPEG data URL before we store it.
// A raw phone photo is several MB; as base64 it's ~33% bigger again, so a
// couple of them blow past the localStorage quota and used to crash the app.
// Capping the longest edge and using JPEG keeps each one well under ~200KB,
// so many cocktails fit comfortably.
export function fileToCompressedImage(file: File, maxEdge = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      // Not an image (e.g. a PDF) — fall back to the raw data URL.
      fileToDataUrl(file).then(resolve, reject)
      return
    }
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
