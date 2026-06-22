import { SEED_INGREDIENTS } from "./fiddlerImport"
import type { FlavorTag, StyleTag } from "../types"

interface StyleLookupEntry {
  tags: FlavorTag[]
  styles: StyleTag[]
}

// Generic bar staples not covered by the Fiddler menu's specific brands —
// matched by substring so "Absolut vodka" and "vodka" both hit "vodka".
const GENERIC_LOOKUP: Record<string, StyleLookupEntry> = {
  vodka: { tags: ["boozy"], styles: ["martini-stirred", "fizz-effervescent"] },
  gin: { tags: ["boozy", "herbal"], styles: ["martini-stirred", "classic-spirit-forward"] },
  rum: { tags: ["sweet", "boozy"], styles: ["tropical-tiki", "refreshing-highball"] },
  tequila: { tags: ["boozy"], styles: ["classic-spirit-forward", "citrus-forward"] },
  whiskey: { tags: ["boozy", "bitter"], styles: ["classic-spirit-forward"] },
  whisky: { tags: ["boozy", "bitter"], styles: ["classic-spirit-forward"] },
  bourbon: { tags: ["boozy", "sweet"], styles: ["classic-spirit-forward"] },
  scotch: { tags: ["boozy", "smoky"], styles: ["classic-spirit-forward", "herbal-bitter"] },
  brandy: { tags: ["boozy", "sweet"], styles: ["classic-spirit-forward"] },
  cognac: { tags: ["boozy", "sweet"], styles: ["classic-spirit-forward"] },
  "triple sec": { tags: ["citrusy", "sweet"], styles: ["citrus-forward", "classic-spirit-forward"] },
  "orange liqueur": { tags: ["citrusy", "sweet"], styles: ["citrus-forward", "classic-spirit-forward"] },
  campari: { tags: ["bitter", "citrusy"], styles: ["fizz-effervescent", "herbal-bitter"] },
  vermouth: { tags: ["herbal", "bitter"], styles: ["martini-stirred", "herbal-bitter"] },
  amaretto: { tags: ["sweet", "nutty"], styles: ["classic-spirit-forward"] },
  "irish cream": { tags: ["sweet", "creamy"], styles: ["creamy-dessert"] },
  "simple syrup": { tags: ["sweet"], styles: ["classic-spirit-forward", "citrus-forward", "refreshing-highball", "tropical-tiki"] },
  "agave syrup": { tags: ["sweet"], styles: ["citrus-forward", "classic-spirit-forward"] },
  "honey syrup": { tags: ["sweet", "floral"], styles: ["classic-spirit-forward", "martini-stirred"] },
  grenadine: { tags: ["sweet", "fruity"], styles: ["tropical-tiki", "refreshing-highball"] },
  "tonic water": { tags: ["bitter", "refreshing"], styles: ["refreshing-highball", "fizz-effervescent"] },
  "club soda": { tags: ["refreshing"], styles: ["refreshing-highball", "fizz-effervescent"] },
  "ginger beer": { tags: ["spicy", "refreshing"], styles: ["refreshing-highball", "tropical-tiki"] },
  "ginger ale": { tags: ["spicy", "sweet"], styles: ["refreshing-highball"] },
  "orange juice": { tags: ["fruity", "sweet", "tangy"], styles: ["tropical-tiki", "refreshing-highball"] },
  "grapefruit juice": { tags: ["citrusy", "tangy", "sour"], styles: ["citrus-forward", "refreshing-highball"] },
  bitters: { tags: ["bitter"], styles: ["classic-spirit-forward", "herbal-bitter"] },
  mint: { tags: ["herbal", "refreshing"], styles: ["refreshing-highball", "tropical-tiki"] },
}

const SEED_LOOKUP = new Map<string, StyleLookupEntry>(
  SEED_INGREDIENTS.map((s) => [s.name.toLowerCase(), { tags: s.tags, styles: s.styles }]),
)

export function lookupStyles(ingredientName: string): StyleLookupEntry | null {
  const key = ingredientName.toLowerCase().trim()

  const exact = SEED_LOOKUP.get(key)
  if (exact) return exact

  for (const [pattern, entry] of Object.entries(GENERIC_LOOKUP)) {
    if (key.includes(pattern)) return entry
  }

  return null
}
