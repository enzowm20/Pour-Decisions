import type { FlavorTag } from "../types"

interface OccasionTheme {
  label: string
  keywords: string[]
  tags: FlavorTag[]
  reason: string
}

const OCCASION_THEMES: OccasionTheme[] = [
  {
    label: "Christmas",
    keywords: ["christmas", "xmas", "santa", "festive season", "secret santa", "ugly sweater"],
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
    keywords: ["valentine", "romance", "romantic", "anniversary"],
    tags: ["sweet", "floral", "fruity"],
    reason: "a romantic, fruit-forward sweetness",
  },
  {
    label: "Date Night",
    keywords: ["date night", "first date", "dinner date"],
    tags: ["dry", "floral", "bitter"],
    reason: "a sophisticated, conversation-friendly profile for a date",
  },
  {
    label: "St Patrick's Day",
    keywords: ["st patrick", "st paddy", "paddy", "irish", "ireland"],
    tags: ["herbal", "earthy", "bitter"],
    reason: "herbal, earthy notes with an Irish edge",
  },
  {
    label: "Match Day",
    keywords: ["world cup", "football", "soccer", "match day", "grand final", "footy", "sports", "super bowl", "nrl", "afl", "rugby"],
    tags: ["refreshing", "citrusy", "boozy"],
    reason: "crowd-pleasing refreshment built for match day",
  },
  {
    label: "Disco Night",
    keywords: ["disco", "70s", "seventies", "retro night", "funk night", "boogie"],
    tags: ["fruity", "sweet", "tangy"],
    reason: "fun, vibrant retro flavours for a disco atmosphere",
  },
  {
    label: "80s Night",
    keywords: ["80s", "eighties", "neon night", "retro party", "throwback"],
    tags: ["sweet", "fruity", "citrusy"],
    reason: "bold, punchy sweetness that matches 80s energy",
  },
  {
    label: "Jazz / Lounge Night",
    keywords: ["piano", "jazz", "lounge", "cocktail hour", "speakeasy", "supper club", "big band"],
    tags: ["bitter", "boozy", "dry"],
    reason: "a classic, spirit-forward lounge character",
  },
  {
    label: "Halloween",
    keywords: ["halloween", "spooky", "haunted", "horror night", "witch", "costume party"],
    tags: ["smoky", "bitter", "tangy"],
    reason: "a darker, smoky edge fitting Halloween",
  },
  {
    label: "Summer / Beach",
    keywords: ["summer", "beach", "pool", "poolside", "tropical", "tiki"],
    tags: ["fruity", "citrusy", "refreshing"],
    reason: "bright tropical refreshment",
  },
  {
    label: "New Year's Eve",
    keywords: ["new year", "nye", "countdown", "midnight", "new years"],
    tags: ["sweet", "tangy", "citrusy"],
    reason: "celebratory sparkle for the countdown",
  },
  {
    label: "Birthday",
    keywords: ["birthday", "bday", "birth day"],
    tags: ["sweet", "fruity", "tangy"],
    reason: "a fun, crowd-pleasing celebration profile",
  },
  {
    label: "Party / Celebration",
    keywords: ["party", "celebration", "celebrate", "launch", "opening night"],
    tags: ["sweet", "fruity", "refreshing"],
    reason: "a vibrant, crowd-pleasing profile perfect for a celebration",
  },
  {
    label: "Winter / Cosy Night In",
    keywords: ["winter", "cosy", "cozy", "fireside", "night in", "hygge", "cold night"],
    tags: ["spicy", "creamy", "sweet"],
    reason: "cosy warmth for a winter night in",
  },
  {
    label: "Garden Party / Spring",
    keywords: ["garden party", "spring", "high tea", "bridal", "wedding", "baby shower", "picnic"],
    tags: ["floral", "citrusy", "fruity"],
    reason: "a light, floral spring character",
  },
  {
    label: "Fiesta",
    keywords: ["mexican", "cinco de mayo", "fiesta", "taco", "margarita night"],
    tags: ["citrusy", "spicy", "sour"],
    reason: "zesty, spiced fiesta character",
  },
  {
    label: "Brunch",
    keywords: ["brunch", "breakfast", "morning after", "sunday session", "mimosa", "bottomless"],
    tags: ["citrusy", "refreshing", "sweet"],
    reason: "light, brunch-friendly citrus and freshness",
  },
  {
    label: "Girls Night / Ladies Night",
    keywords: ["girls night", "ladies night", "hens", "hen night", "hen party", "bachelorette", "galentine"],
    tags: ["sweet", "floral", "fruity"],
    reason: "fun, colourful sweetness and florals for a girls night",
  },
  {
    label: "Bucks Night / Stag Do",
    keywords: ["bucks", "buck night", "stag", "stag do", "stag night", "bachelor"],
    tags: ["boozy", "bitter", "citrusy"],
    reason: "bold, spirit-forward drinks for a bucks night",
  },
  {
    label: "Oktoberfest",
    keywords: ["oktoberfest", "german", "beer festival", "lederhosen", "beer garden"],
    tags: ["earthy", "herbal", "bitter"],
    reason: "earthy, herbal depth fitting an Oktoberfest atmosphere",
  },
  {
    label: "Casino / Vegas Night",
    keywords: ["casino", "vegas", "las vegas", "poker night", "james bond", "black tie", "high roller"],
    tags: ["dry", "boozy", "bitter"],
    reason: "sleek, spirit-forward sophistication for a casino night",
  },
  {
    label: "Rooftop / Sky Bar",
    keywords: ["rooftop", "sky bar", "rooftop bar", "sunset drinks", "sundowner", "view"],
    tags: ["citrusy", "refreshing", "dry"],
    reason: "crisp, refreshing drinks suited to a rooftop setting",
  },
  {
    label: "Karaoke Night",
    keywords: ["karaoke", "kareoke", "singing night", "open mic"],
    tags: ["sweet", "fruity", "boozy"],
    reason: "bold, fun flavours to fuel a karaoke night",
  },
  {
    label: "Game Night",
    keywords: ["game night", "board game", "trivia", "quiz night", "pub quiz"],
    tags: ["refreshing", "citrusy", "sweet"],
    reason: "easy-drinking, sessionable flavours for a game night",
  },
  {
    label: "Dinner Party",
    keywords: ["dinner party", "dinner", "wine and cheese", "supper", "formal dinner", "host"],
    tags: ["dry", "herbal", "bitter"],
    reason: "elegant, food-friendly complexity for a dinner party",
  },
  {
    label: "Hawaiian / Luau",
    keywords: ["hawaii", "luau", "hawaiian", "tropical party", "aloha", "island"],
    tags: ["fruity", "sweet", "citrusy"],
    reason: "lush, tropical fruit flavours for a luau vibe",
  },
  {
    label: "Pride / Rainbow Party",
    keywords: ["pride", "rainbow", "lgbtq", "drag night", "pride parade"],
    tags: ["fruity", "sweet", "tangy"],
    reason: "vibrant, colourful, celebratory flavours for Pride",
  },
  {
    label: "Day Club / Pool Party",
    keywords: ["day club", "day party", "pool party", "day rave", "festival"],
    tags: ["refreshing", "citrusy", "fruity"],
    reason: "light, refreshing flavours made for a day party",
  },
  {
    label: "Work Event / Corporate",
    keywords: ["work", "corporate", "office party", "work do", "company", "networking", "conference"],
    tags: ["refreshing", "dry", "citrusy"],
    reason: "approachable, crowd-safe flavours for a work event",
  },
  {
    label: "Movie Night",
    keywords: ["movie", "film night", "movie night", "cinema", "netflix", "watch party"],
    tags: ["sweet", "creamy", "fruity"],
    reason: "easy-sipping, laid-back flavours for a movie night",
  },
  {
    label: "Masquerade / Costume Ball",
    keywords: ["masquerade", "costume ball", "ball", "gala", "opera", "theatre"],
    tags: ["floral", "dry", "bitter"],
    reason: "theatrical, refined sophistication for a masquerade",
  },
  {
    label: "BBQ / Cookout",
    keywords: ["bbq", "barbecue", "cookout", "backyard", "grill", "sausage sizzle", "aussie bbq"],
    tags: ["refreshing", "citrusy", "earthy"],
    reason: "crisp, refreshing flavours that pair with outdoor grilling",
  },
  {
    label: "Holiday",
    keywords: ["holiday", "vacation", "resort", "cruise", "getaway"],
    tags: ["fruity", "refreshing", "citrusy"],
    reason: "carefree, holiday-mode refreshment",
  },
]

const FALLBACK: { tags: FlavorTag[]; reason: string } = {
  tags: ["refreshing", "sweet", "citrusy"],
  reason: "a broadly crowd-pleasing, refreshing profile since that occasion isn't one I recognise yet",
}

// Split into individual words and check each against the query, as well as
// full phrase matching — so "a disco-themed night" hits "disco" even though
// the phrase "disco night" isn't in the query verbatim.
function matchesTheme(theme: OccasionTheme, lower: string): boolean {
  return theme.keywords.some((k) => {
    if (lower.includes(k)) return true
    // Also try each word of a multi-word keyword individually
    const words = k.split(/\s+/)
    if (words.length > 1) return false // multi-word keys must match as phrase
    return false
  })
}

export function inferOccasionTags(query: string): { label: string | null; tags: FlavorTag[]; reason: string } {
  const lower = query.toLowerCase()
  for (const theme of OCCASION_THEMES) {
    if (matchesTheme(theme, lower)) {
      return { label: theme.label, tags: theme.tags, reason: theme.reason }
    }
  }
  return { label: null, ...FALLBACK }
}
