import { supabase, PHOTOS_BUCKET } from "./supabaseClient"
import { makeId } from "./id"

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Downscale + re-encode an image to a small JPEG data URL before upload. A
// raw phone photo is several MB; capping the longest edge and using JPEG
// keeps each one well under ~200KB, so uploads stay fast.
export function fileToCompressedImage(file: File, maxEdge = 720, quality = 0.6): Promise<string> {
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

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "image/jpeg"
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// Photos enter the app as base64 data URLs (from fileToCompressedImage), but
// the database only ever stores a public Storage URL — uploading is what
// actually moves the bytes off this one browser and onto the shared public
// server, which is the whole point of this migration off localStorage. A
// value that's already an http(s) URL has been uploaded before (e.g. on a
// later edit of the same entity), so it's passed through untouched.
export async function uploadPhotoIfNeeded(photo: string, pathPrefix: string): Promise<string> {
  if (!photo.startsWith("data:")) return photo
  const blob = dataUrlToBlob(photo)
  const path = `${pathPrefix}/${makeId()}.jpg`
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
  })
  if (error) {
    console.warn(`Couldn't upload photo to "${path}" — keeping it inline for now.`, error)
    return photo
  }
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}
