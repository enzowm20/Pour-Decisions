import { createWorker } from "tesseract.js"
import * as pdfjsLib from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

// OCR for photos of a menu. Runs entirely in the browser (no API calls, no
// per-request cost) — accuracy depends heavily on photo quality, lighting,
// and how stylised the menu's fonts are, so treat the result as a draft to
// proofread, not a guaranteed-correct transcription.
export async function extractTextFromImage(file: File): Promise<string> {
  const worker = await createWorker("eng")
  try {
    const { data } = await worker.recognize(file)
    return data.text
  } finally {
    await worker.terminate()
  }
}

// Pulls the embedded text layer out of a PDF. Only works if the PDF has
// real selectable text — a PDF that's just a scanned photo with no text
// layer will come back empty, since there's nothing to extract (that case
// would need OCR on a rendered page image, which isn't implemented here).
export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const pageTexts: string[] = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ")
    pageTexts.push(text)
  }
  return pageTexts.join("\n\n")
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") return extractTextFromPdf(file)
  return extractTextFromImage(file)
}
