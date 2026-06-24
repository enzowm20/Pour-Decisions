export type IngredientCategory = "spirit" | "mixer" | "citrus" | "sweetener" | "fruit" | "other"

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  spirit: "Spirit",
  mixer: "Mixer",
  citrus: "Citrus",
  sweetener: "Sweetener",
  fruit: "Fruit",
  other: "Top-up",
}

export const FLAVOR_TAGS = [
  "bitter",
  "boozy",
  "citrusy",
  "creamy",
  "dry",
  "earthy",
  "floral",
  "fruity",
  "herbal",
  "nutty",
  "refreshing",
  "savory",
  "smoky",
  "sour",
  "spicy",
  "sweet",
  "tangy",
] as const

export type FlavorTag = (typeof FLAVOR_TAGS)[number]

// Which cocktail "family" an ingredient belongs to — separate from flavor.
// Two ingredients can both be "sweet" without ever appearing in the same
// drink (Kahlua and limoncello, say); style is what keeps combinations
// realistic, since the combo generator only pairs ingredients that share
// at least one style with the chosen spirit.
export const STYLE_TAGS = [
  "citrus-forward",
  "classic-spirit-forward",
  "creamy-dessert",
  "fizz-effervescent",
  "herbal-bitter",
  "martini-stirred",
  "refreshing-highball",
  "tropical-tiki",
] as const

export type StyleTag = (typeof STYLE_TAGS)[number]

export const STYLE_LABELS: Record<StyleTag, string> = {
  "citrus-forward": "Citrus-forward",
  "classic-spirit-forward": "Classic spirit-forward",
  "creamy-dessert": "Creamy / dessert",
  "fizz-effervescent": "Fizz / effervescent",
  "herbal-bitter": "Herbal / bitter",
  "martini-stirred": "Martini / stirred",
  "refreshing-highball": "Refreshing highball",
  "tropical-tiki": "Tropical / tiki",
}

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  tags: FlavorTag[]
  styles: StyleTag[]
  inStock: boolean
  costPerServing?: number
}

export interface Substitution {
  id: string
  ingredientName: string
  substituteName: string
  note?: string
}

export interface Venue {
  id: string
  name: string
}

export interface Scan {
  id: string
  venueId: string
  date: string // date this scan was logged into the system
  photoDate: string // date the menu photo was actually taken/sourced
  photos: string[]
}

export type MenuCategory =
  | "core"
  | "seasonal"
  | "event-special"
  | "venue-hybrid"
  | "mocktail"
  | "discontinued"

export interface Recipe {
  id: string
  name: string
  venueId: string | null // null = own venue's menu
  scanId: string | null // null if own venue recipe
  ingredientIds: string[]
  // Ingredient names found in a scanned/imported recipe that don't match
  // anything in stock — recorded by name instead of silently creating a new
  // Ingredient, so they show up as flagged substitution candidates instead.
  missingIngredientNames?: string[]
  menuCategory?: MenuCategory // only meaningful when venueId is null; defaults to "core"
  sellPrice?: number
  // Snapshot of the cocktail's photo, copied from the source Archive
  // experiment when promoted — kept on the recipe so the menu image survives
  // even if the experiment is later renamed or deleted.
  photo?: string
}

// A recipe sent over from a venue scan via "Send to Experiment Lab" — queued
// here rather than navigating straight there, so it shows up under a
// heading on that page to review whenever you get to it.
export interface LabQueueItem {
  id: string
  name: string
  ingredientIds: string[]
}

export type ExperimentOutcome = "worked" | "needs-work" | "failed"

export const GLASS_TYPES = [
  "lowball",
  "highball",
  "fluted tall glass",
  "fluted short glass",
  "coupe",
  "wine glass",
  "mason jar",
  "carafe",
] as const

export type GlassType = (typeof GLASS_TYPES)[number]

export interface Experiment {
  id: string
  name: string
  sourceRecipeId?: string
  tags: FlavorTag[]
  ingredientIds: string[]
  outcome: ExperimentOutcome
  glass?: GlassType
  garnish: string
  notes: string
  photos: string[]
  date: string
  promotedToMenu: boolean
}

export type RecipeStatus = "makeable" | "substitute" | "purchase"

export interface RecipeIngredientStatus {
  ingredient: Ingredient
  status: "have" | "substitute" | "missing"
  substitute?: Ingredient
}

export interface RecipeCheckResult {
  status: RecipeStatus
  items: RecipeIngredientStatus[]
  toPurchase: Ingredient[]
}
