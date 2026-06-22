// Heuristic best-effort parser for raw OCR/PDF text into candidate recipes.
// Real menus vary wildly in layout, so this is deliberately conservative —
// it's meant to produce a rough first pass for a human to correct in the
// review step, not a guaranteed-accurate transcription.

export interface ParsedRecipe {
  name: string
  ingredientNames: string[]
}

// Strips a leading quantity/unit off an ingredient line, e.g. "45ml Vodka"
// or "1 oz Lime juice" or "2 dashes Bitters" -> "Vodka" / "Lime juice" / "Bitters".
function stripQuantity(line: string): string {
  return line
    .replace(/^[\s•\-*·]+/, "")
    .replace(/^\d+(\.\d+)?\s*(ml|oz|cl|dash(es)?|drops?|parts?)\b\.?\s*/i, "")
    .replace(/^\d+(\.\d+)?\s*/, "")
    .trim()
}

function looksLikeIngredientLine(line: string): boolean {
  if (line.length === 0) return false
  // A line that's mostly a number+unit, or contains a comma-separated list,
  // reads as an ingredient line rather than a cocktail's name/heading.
  return /^\s*[\d•\-*·]/.test(line) || /,/.test(line)
}

export function parseMenuText(rawText: string): ParsedRecipe[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const recipes: ParsedRecipe[] = []
  let current: ParsedRecipe | null = null

  for (const line of lines) {
    if (looksLikeIngredientLine(line)) {
      if (!current) continue // ingredient line with no name seen yet — skip
      const parts = line.includes(",") ? line.split(",") : [line]
      for (const part of parts) {
        const cleaned = stripQuantity(part)
        if (cleaned.length > 1) current.ingredientNames.push(cleaned)
      }
      continue
    }

    // Looks like a new cocktail name/heading — anything reasonably short,
    // not all-numbers, starts a new recipe block.
    const cleanedName = line.replace(/[:.\-–]+$/, "").trim()
    if (cleanedName.length === 0 || cleanedName.length > 60) continue

    if (current) recipes.push(current)
    current = { name: cleanedName, ingredientNames: [] }
  }
  if (current) recipes.push(current)

  // Drop blocks that never picked up any ingredients — almost always noise
  // (a stray heading, page title, etc.) rather than an actual recipe.
  return recipes.filter((r) => r.ingredientNames.length > 0)
}
