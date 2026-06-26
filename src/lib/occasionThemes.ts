import type { FlavorTag } from "../types"

// There's no AI behind this — it's a keyword lookup against the same flavor
// tags the rest of the app already understands, so "plan a cocktail for X"
// reuses the exact same proven-pairing combo generator as the tag picker
// above it. Deliberately broad keyword lists rather than exact phrases, so
// "xmas", "christmas party", and "secret santa" all land the same entry.
interface OccasionTheme {
  label: string
  keywords: string[]
  tags: FlavorTag[]
  reason: string
}

const OCCASION_THEMES: OccasionTheme[] = [
  {
    label: "Christmas",
    keywords: ["christmas", "xmas", "santa", "festive season"],
    tags: ["spicy", "sweet", "creamy"],
    reason: "warm spice and rich sweetness for festive cheer",
  },
  {
    label: "Easter",
    keywords: ["easter"],
    tags: ["fruity", "floral", "sweet"],
    reason: "fresh, pastel-bright fruit and florals for Easter",
  },
  {
    label: "Valentine's Day",
    keywords: ["valentine", "romance", "romantic", "date night", "anniversary"],
    tags: ["sweet", "floral", "fruity"],
    reason: "a romantic, fruit-forward sweetness",
  },
  {
    label: "St Patrick's Day",
    keywords: ["st patrick", "paddy", "irish"],
    tags: ["herbal", "earthy", "bitter"],
    reason: "herbal, earthy notes with an Irish edge",
  },
  {
    label: "Match Day",
    keywords: ["world cup", "football", "soccer", "match day", "grand final", "footy", "sports"],
    tags: ["refreshing", "citrusy", "boozy"],
    reason: "crowd-pleasing refreshment built for match day",
  },
  {
    label: "Piano/Jazz Night",
    keywords: ["piano", "jazz", "lounge", "cocktail hour", "speakeasy"],
    tags: ["bitter", "boozy", "dry"],
    reason: "a classic, spirit-forward lounge character",
  },
  {
    label: "Halloween",
    keywords: ["halloween", "spooky", "haunted"],
    tags: ["smoky", "bitter", "tangy"],
    reason: "a darker, smoky edge fitting Halloween",
  },
  {
    label: "Summer/Beach",
    keywords: ["summer", "beach", "pool", "poolside", "tropical", "holiday"],
    tags: ["fruity", "citrusy", "refreshing"],
    reason: "bright tropical refreshment",
  },
  {
    label: "New Year's Eve",
    keywords: ["new year", "nye", "countdown", "midnight"],
    tags: ["sweet", "tangy", "citrusy"],
    reason: "celebratory sparkle for the countdown",
  },
  {
    label: "Birthday/Party",
    keywords: ["birthday", "party", "celebration", "celebrate"],
    tags: ["sweet", "fruity", "tangy"],
    reason: "a fun, crowd-pleasing celebration profile",
  },
  {
    label: "Winter/Cosy Night In",
    keywords: ["winter", "cosy", "cozy", "fireside", "night in"],
    tags: ["spicy", "creamy", "sweet"],
    reason: "cosy warmth for a winter night in",
  },
  {
    label: "Garden Party/Spring",
    keywords: ["garden party", "spring", "high tea", "bridal", "wedding"],
    tags: ["floral", "citrusy", "fruity"],
    reason: "a light, floral spring character",
  },
  {
    label: "Fiesta",
    keywords: ["mexican", "cinco de mayo", "fiesta", "taco"],
    tags: ["citrusy", "spicy", "sour"],
    reason: "zesty, spiced fiesta character",
  },
]

const FALLBACK: { tags: FlavorTag[]; reason: string } = {
  tags: ["refreshing", "sweet", "citrusy"],
  reason: "a broadly crowd-pleasing, refreshing profile since that occasion isn't one I recognise yet",
}

export function inferOccasionTags(query: string): { label: string | null; tags: FlavorTag[]; reason: string } {
  const lower = query.toLowerCase()
  for (const theme of OCCASION_THEMES) {
    if (theme.keywords.some((k) => lower.includes(k))) {
      return { label: theme.label, tags: theme.tags, reason: theme.reason }
    }
  }
  return { label: null, ...FALLBACK }
}
