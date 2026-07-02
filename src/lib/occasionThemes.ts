import type { FlavorTag } from "../types"

interface OccasionTheme {
  label: string
  keywords: string[]
  tags: FlavorTag[]
  reason: string
}

const OCCASION_THEMES: OccasionTheme[] = [
  // ── Holidays & Calendar ──────────────────────────────────────────────────
  {
    label: "Christmas",
    keywords: ["christmas", "xmas", "santa", "festive season", "secret santa", "ugly sweater", "yuletide", "noel"],
    tags: ["spicy", "sweet", "creamy"],
    reason: "warm spice and rich sweetness for festive cheer",
  },
  {
    label: "Easter",
    keywords: ["easter", "hot cross", "easter egg hunt"],
    tags: ["fruity", "floral", "sweet"],
    reason: "fresh, pastel-bright fruit and florals for Easter",
  },
  {
    label: "Valentine's Day",
    keywords: ["valentine", "valentines", "romance", "romantic", "anniversary"],
    tags: ["sweet", "floral", "fruity"],
    reason: "a romantic, fruit-forward sweetness",
  },
  {
    label: "New Year's Eve",
    keywords: ["new year", "nye", "countdown", "midnight", "new years", "new year's"],
    tags: ["sweet", "tangy", "citrusy"],
    reason: "celebratory sparkle for the countdown",
  },
  {
    label: "New Year's Day",
    keywords: ["new year's day", "new years day", "january 1", "hair of the dog"],
    tags: ["refreshing", "citrusy", "sweet"],
    reason: "a gentle, reviving profile for New Year's Day",
  },
  {
    label: "St Patrick's Day",
    keywords: ["st patrick", "st paddy", "paddy", "irish", "ireland", "paddys day", "st pats"],
    tags: ["herbal", "earthy", "bitter"],
    reason: "herbal, earthy notes with an Irish edge",
  },
  {
    label: "Halloween",
    keywords: ["halloween", "spooky", "haunted", "horror night", "witch", "costume party", "trick or treat", "all hallows"],
    tags: ["smoky", "bitter", "tangy"],
    reason: "a darker, smoky edge fitting Halloween",
  },
  {
    label: "Bonfire Night",
    keywords: ["bonfire", "guy fawkes", "fireworks night", "bonfire night"],
    tags: ["smoky", "spicy", "sweet"],
    reason: "smoky warmth and spice for a bonfire atmosphere",
  },
  {
    label: "Cinco de Mayo",
    keywords: ["cinco de mayo", "mexican independence", "may 5"],
    tags: ["citrusy", "spicy", "sour"],
    reason: "zesty, spiced fiesta character for Cinco de Mayo",
  },
  {
    label: "Australia Day",
    keywords: ["australia day", "australia", "straya", "aussie day", "january 26"],
    tags: ["refreshing", "citrusy", "fruity"],
    reason: "a laid-back, refreshing profile for Australia Day",
  },
  {
    label: "Labour Day / Long Weekend",
    keywords: ["labour day", "labor day", "long weekend", "public holiday"],
    tags: ["refreshing", "fruity", "citrusy"],
    reason: "easy-drinking, holiday-mode refreshment",
  },
  {
    label: "Mother's Day",
    keywords: ["mothers day", "mother's day", "mum's day", "mom", "mum"],
    tags: ["floral", "sweet", "fruity"],
    reason: "elegant florals and gentle sweetness for Mother's Day",
  },
  {
    label: "Father's Day",
    keywords: ["fathers day", "father's day", "dad", "fathers"],
    tags: ["boozy", "bitter", "dry"],
    reason: "a classic, spirit-forward profile for Father's Day",
  },
  {
    label: "Diwali",
    keywords: ["diwali", "deepavali", "festival of lights", "diwali night"],
    tags: ["sweet", "spicy", "fruity"],
    reason: "vibrant sweetness and spice for the Festival of Lights",
  },
  {
    label: "Chinese New Year",
    keywords: ["chinese new year", "lunar new year", "cny", "spring festival"],
    tags: ["fruity", "sweet", "citrusy"],
    reason: "bright, celebratory fruit and sweetness for Lunar New Year",
  },
  {
    label: "Mardi Gras / Carnival",
    keywords: ["mardi gras", "carnival", "fat tuesday", "masquerade", "parade"],
    tags: ["fruity", "sweet", "tangy"],
    reason: "colourful, vibrant flavours for Mardi Gras",
  },
  {
    label: "Thanksgiving",
    keywords: ["thanksgiving", "thanks giving", "harvest dinner"],
    tags: ["spicy", "sweet", "earthy"],
    reason: "warm harvest spice and earthy depth for Thanksgiving",
  },
  {
    label: "4th of July",
    keywords: ["4th of july", "fourth of july", "independence day", "july 4"],
    tags: ["fruity", "refreshing", "citrusy"],
    reason: "bright, patriotic refreshment for the 4th of July",
  },
  {
    label: "Oktoberfest",
    keywords: ["oktoberfest", "german", "beer festival", "lederhosen", "beer garden", "oktoberfest"],
    tags: ["earthy", "herbal", "bitter"],
    reason: "earthy, herbal depth fitting an Oktoberfest atmosphere",
  },
  {
    label: "Pride",
    keywords: ["pride", "rainbow", "lgbtq", "drag night", "pride parade", "queer night", "gay bar"],
    tags: ["fruity", "sweet", "tangy"],
    reason: "vibrant, colourful, celebratory flavours for Pride",
  },
  // ── Seasons ──────────────────────────────────────────────────────────────
  {
    label: "Summer",
    keywords: ["summer", "summertime", "hot day", "heat wave"],
    tags: ["fruity", "citrusy", "refreshing"],
    reason: "bright, cooling refreshment for summer",
  },
  {
    label: "Beach / Pool Day",
    keywords: ["beach", "pool", "poolside", "waterfront", "coastal", "seaside", "surf"],
    tags: ["fruity", "citrusy", "refreshing"],
    reason: "tropical refreshment for a beach or pool setting",
  },
  {
    label: "Winter Night",
    keywords: ["winter", "cold night", "freezing", "snow night", "blizzard"],
    tags: ["spicy", "creamy", "sweet"],
    reason: "cosy warmth for a cold winter night",
  },
  {
    label: "Cosy Night In",
    keywords: ["cosy", "cozy", "night in", "fireside", "hygge", "stay in", "quiet night"],
    tags: ["spicy", "creamy", "sweet"],
    reason: "a warm, indulgent profile for a cosy night in",
  },
  {
    label: "Autumn / Fall",
    keywords: ["autumn", "fall", "harvest", "foliage", "october", "november"],
    tags: ["spicy", "earthy", "sweet"],
    reason: "warm spice and earthy depth for the autumn season",
  },
  {
    label: "Spring Garden Party",
    keywords: ["spring", "garden party", "high tea", "afternoon tea", "picnic"],
    tags: ["floral", "citrusy", "fruity"],
    reason: "a light, floral spring character",
  },
  // ── Nightlife & Music ─────────────────────────────────────────────────────
  {
    label: "Disco Night",
    keywords: ["disco", "70s", "seventies", "retro night", "funk", "boogie", "disco ball"],
    tags: ["fruity", "sweet", "tangy"],
    reason: "fun, vibrant retro flavours for a disco atmosphere",
  },
  {
    label: "80s Night",
    keywords: ["80s", "eighties", "neon night", "throwback", "synth", "pop night"],
    tags: ["sweet", "fruity", "citrusy"],
    reason: "bold, punchy sweetness that matches 80s energy",
  },
  {
    label: "90s Night",
    keywords: ["90s", "nineties", "nineties night", "britpop"],
    tags: ["sweet", "fruity", "tangy"],
    reason: "nostalgic, fruit-forward flavours for a 90s night",
  },
  {
    label: "Jazz / Lounge Night",
    keywords: ["jazz", "lounge", "speakeasy", "supper club", "big band", "swing night", "blues night"],
    tags: ["bitter", "boozy", "dry"],
    reason: "a classic, spirit-forward lounge character",
  },
  {
    label: "Piano Bar Night",
    keywords: ["piano", "piano bar", "cocktail hour", "piano night"],
    tags: ["bitter", "dry", "boozy"],
    reason: "sophisticated, spirit-led drinks for a piano bar setting",
  },
  {
    label: "Karaoke Night",
    keywords: ["karaoke", "kareoke", "singing night", "open mic", "karaoke bar"],
    tags: ["sweet", "fruity", "boozy"],
    reason: "bold, fun flavours to fuel a karaoke night",
  },
  {
    label: "Cowboy Night",
    keywords: ["cowboy", "western", "country night", "rodeo", "saloon", "wild west", "yeehaw", "country music", "line dancing", "honky tonk"],
    tags: ["smoky", "spicy", "earthy"],
    reason: "smoky, bold character with a Western edge",
  },
  {
    label: "Latin Night",
    keywords: ["latin night", "salsa night", "bachata", "salsa", "latin", "samba", "reggaeton"],
    tags: ["fruity", "citrusy", "spicy"],
    reason: "lively citrus and spice for a Latin night",
  },
  {
    label: "Hip Hop Night",
    keywords: ["hip hop", "hiphop", "rap night", "rnb", "r&b night"],
    tags: ["sweet", "fruity", "boozy"],
    reason: "bold, flavour-forward drinks for an R&B and hip hop night",
  },
  {
    label: "Rave / EDM Night",
    keywords: ["rave", "edm", "electronic", "techno", "house music", "dj night", "club night", "festival"],
    tags: ["citrusy", "sweet", "refreshing"],
    reason: "energising, high-impact citrus and sweetness for a rave",
  },
  {
    label: "Rock Night",
    keywords: ["rock night", "metal night", "rock bar", "punk night", "live music", "band night"],
    tags: ["boozy", "bitter", "smoky"],
    reason: "bold, no-nonsense drinks for a rock night",
  },
  {
    label: "Reggae Night",
    keywords: ["reggae", "ska", "jamaican night", "island night"],
    tags: ["fruity", "sweet", "citrusy"],
    reason: "laid-back tropical vibes for a reggae night",
  },
  {
    label: "Opera / Theatre Night",
    keywords: ["opera", "theatre", "theater", "ballet", "symphony", "classical music", "concert night"],
    tags: ["floral", "dry", "bitter"],
    reason: "refined, theatrical sophistication for an opera or theatre evening",
  },
  // ── Occasions & Milestones ────────────────────────────────────────────────
  {
    label: "Birthday",
    keywords: ["birthday", "bday", "birth day", "turning 21", "turning 30", "turning 40", "turning 50"],
    tags: ["sweet", "fruity", "tangy"],
    reason: "a fun, crowd-pleasing celebration profile",
  },
  {
    label: "Wedding",
    keywords: ["wedding", "wedding reception", "wedding night", "nuptials", "wedding day"],
    tags: ["floral", "citrusy", "sweet"],
    reason: "elegant florals and citrus for a wedding celebration",
  },
  {
    label: "Engagement Party",
    keywords: ["engagement", "engaged", "engagement party", "proposal party"],
    tags: ["floral", "sweet", "fruity"],
    reason: "a celebratory, romantic profile for an engagement party",
  },
  {
    label: "Bachelorette / Hens Night",
    keywords: ["hens", "hen night", "hen party", "bachelorette", "girls send-off", "hens do"],
    tags: ["sweet", "floral", "fruity"],
    reason: "fun, colourful sweetness and florals for a hens night",
  },
  {
    label: "Bucks / Stag Night",
    keywords: ["bucks", "buck night", "stag", "stag do", "stag night", "bachelor party", "bucks night"],
    tags: ["boozy", "bitter", "citrusy"],
    reason: "bold, spirit-forward drinks for a bucks night",
  },
  {
    label: "Baby Shower",
    keywords: ["baby shower", "gender reveal", "baby party", "new baby"],
    tags: ["sweet", "fruity", "floral"],
    reason: "soft, sweet, crowd-friendly flavours for a baby shower",
  },
  {
    label: "Graduation Party",
    keywords: ["graduation", "grad party", "uni grad", "school formal", "end of school"],
    tags: ["sweet", "fruity", "tangy"],
    reason: "celebratory, crowd-pleasing profile for a graduation",
  },
  {
    label: "Retirement Party",
    keywords: ["retirement", "retiring", "farewell party", "leaving party"],
    tags: ["dry", "boozy", "bitter"],
    reason: "a distinguished, spirit-forward send-off for retirement",
  },
  {
    label: "Promotion Celebration",
    keywords: ["promotion", "new job", "got the job", "job celebration", "career win"],
    tags: ["dry", "citrusy", "boozy"],
    reason: "a crisp, celebratory profile for a career milestone",
  },
  {
    label: "Housewarming",
    keywords: ["housewarming", "house warming", "new home", "new house", "moved in"],
    tags: ["refreshing", "fruity", "sweet"],
    reason: "warm, welcoming flavours for a housewarming",
  },
  {
    label: "Farewell",
    keywords: ["farewell", "going away", "send off", "leaving drinks", "goodbye party"],
    tags: ["boozy", "sweet", "citrusy"],
    reason: "a memorable, heartfelt profile for a farewell drinks night",
  },
  // ── Sports & Watching Events ──────────────────────────────────────────────
  {
    label: "Grand Final / Match Day",
    keywords: ["grand final", "match day", "game day", "super bowl", "world cup", "finals week"],
    tags: ["refreshing", "citrusy", "boozy"],
    reason: "crowd-pleasing refreshment built for a big match",
  },
  {
    label: "Football / Footy Night",
    keywords: ["footy", "football", "nrl", "afl", "soccer", "rugby", "league"],
    tags: ["refreshing", "citrusy", "boozy"],
    reason: "easy-drinking refreshment for a footy night",
  },
  {
    label: "F1 Watch Party",
    keywords: ["formula 1", "formula one", "f1", "grand prix", "racing night"],
    tags: ["dry", "citrusy", "boozy"],
    reason: "a sleek, high-octane profile for an F1 watch party",
  },
  {
    label: "Boxing Night",
    keywords: ["boxing", "boxing match", "ufc", "mma", "fight night"],
    tags: ["boozy", "bitter", "citrusy"],
    reason: "bold, punchy flavours for a fight night",
  },
  {
    label: "Golf Day",
    keywords: ["golf", "golf day", "golf tournament", "hole in one"],
    tags: ["refreshing", "citrusy", "dry"],
    reason: "crisp, refreshing drinks suited to a day on the course",
  },
  {
    label: "Tennis Party",
    keywords: ["tennis", "wimbledon", "tennis party", "tennis match"],
    tags: ["refreshing", "floral", "citrusy"],
    reason: "light, refreshing flavours suited to a tennis occasion",
  },
  // ── Themed Events ─────────────────────────────────────────────────────────
  {
    label: "Casino Night",
    keywords: ["casino", "vegas", "las vegas", "poker night", "james bond", "high roller", "casino royale"],
    tags: ["dry", "boozy", "bitter"],
    reason: "sleek, spirit-forward sophistication for a casino night",
  },
  {
    label: "Black Tie / Gala",
    keywords: ["black tie", "gala", "formal", "charity ball", "awards night", "oscars", "red carpet"],
    tags: ["floral", "dry", "bitter"],
    reason: "refined, black-tie sophistication",
  },
  {
    label: "Masquerade Ball",
    keywords: ["masquerade", "costume ball", "venetian", "masked ball"],
    tags: ["floral", "dry", "bitter"],
    reason: "theatrical, mysterious sophistication for a masquerade",
  },
  {
    label: "Hawaiian / Luau",
    keywords: ["hawaii", "luau", "hawaiian", "luau party", "aloha", "island party", "tiki"],
    tags: ["fruity", "sweet", "citrusy"],
    reason: "lush, tropical fruit flavours for a luau vibe",
  },
  {
    label: "Pirate Night",
    keywords: ["pirate", "pirate night", "pirates", "rum night", "ahoy"],
    tags: ["smoky", "spicy", "sweet"],
    reason: "adventurous, swashbuckling flavours for a pirate night",
  },
  {
    label: "Superhero Party",
    keywords: ["superhero", "marvel", "dc", "comic", "cosplay party"],
    tags: ["fruity", "sweet", "tangy"],
    reason: "bold, action-packed flavours for a superhero night",
  },
  {
    label: "Murder Mystery",
    keywords: ["murder mystery", "whodunit", "detective night", "clue night"],
    tags: ["bitter", "dry", "smoky"],
    reason: "dark, mysterious flavours fitting a murder mystery night",
  },
  {
    label: "James Bond Night",
    keywords: ["james bond", "007", "spy night", "bond night"],
    tags: ["dry", "boozy", "bitter"],
    reason: "a shaken, not stirred — spirit-forward sophistication for a Bond night",
  },
  {
    label: "Medieval / Renaissance Fair",
    keywords: ["medieval", "renaissance", "knights", "castle", "royal feast", "king and queen"],
    tags: ["herbal", "spicy", "earthy"],
    reason: "hearty herbal and spice character for a medieval feast",
  },
  {
    label: "Space / Sci-Fi Night",
    keywords: ["space", "sci-fi", "scifi", "star wars", "star trek", "galaxy", "astronaut"],
    tags: ["citrusy", "sweet", "tangy"],
    reason: "out-of-this-world citrus and boldness for a sci-fi night",
  },
  {
    label: "Jungle / Safari Party",
    keywords: ["jungle", "safari", "tropical party", "amazon", "wildlife night"],
    tags: ["fruity", "earthy", "spicy"],
    reason: "wild tropical character for a jungle or safari theme",
  },
  {
    label: "Hollywood / Movie Premiere",
    keywords: ["hollywood", "movie premiere", "film premiere", "cinema night", "oscars party"],
    tags: ["dry", "floral", "citrusy"],
    reason: "glamorous, polished flavours for a Hollywood night",
  },
  // ── Social Occasions ──────────────────────────────────────────────────────
  {
    label: "Date Night",
    keywords: ["date night", "first date", "dinner date", "romantic dinner"],
    tags: ["dry", "floral", "bitter"],
    reason: "a sophisticated, conversation-friendly profile for a date",
  },
  {
    label: "Girls Night",
    keywords: ["girls night", "ladies night", "galentine", "girls trip", "girls dinner"],
    tags: ["sweet", "floral", "fruity"],
    reason: "fun, colourful sweetness and florals for a girls night",
  },
  {
    label: "Boys Night",
    keywords: ["boys night", "lads night", "guys night", "boys trip"],
    tags: ["boozy", "bitter", "citrusy"],
    reason: "bold, sessionable drinks for a boys night",
  },
  {
    label: "Dinner Party",
    keywords: ["dinner party", "supper party", "hosting dinner", "hosting"],
    tags: ["dry", "herbal", "bitter"],
    reason: "elegant, food-friendly complexity for a dinner party",
  },
  {
    label: "Brunch",
    keywords: ["brunch", "bottomless brunch", "sunday session", "mimosa", "morning drinks", "sunday brunch"],
    tags: ["citrusy", "refreshing", "sweet"],
    reason: "light, brunch-friendly citrus and freshness",
  },
  {
    label: "Catch-Up / Get Together",
    keywords: ["catch up", "get together", "friends drinks", "casual drinks", "low key"],
    tags: ["refreshing", "fruity", "citrusy"],
    reason: "easy-going, crowd-pleasing flavours for a casual catch-up",
  },
  {
    label: "Game Night",
    keywords: ["game night", "board game", "trivia", "quiz night", "pub quiz", "card night"],
    tags: ["refreshing", "citrusy", "sweet"],
    reason: "easy-drinking, sessionable flavours for a game night",
  },
  {
    label: "Movie Night",
    keywords: ["movie night", "film night", "netflix", "watch party", "movie marathon"],
    tags: ["sweet", "creamy", "fruity"],
    reason: "easy-sipping, laid-back flavours for a movie night",
  },
  {
    label: "Book Club",
    keywords: ["book club", "book night", "literary", "reading night"],
    tags: ["dry", "herbal", "floral"],
    reason: "thoughtful, refined sipping for a book club evening",
  },
  {
    label: "Open House",
    keywords: ["open house", "meet the neighbours", "neighbourhood party", "block party"],
    tags: ["refreshing", "sweet", "fruity"],
    reason: "approachable, crowd-safe flavours for an open house",
  },
  // ── Work & Professional ───────────────────────────────────────────────────
  {
    label: "Work Event",
    keywords: ["work", "office party", "work do", "work drinks", "company party", "networking", "conference", "team drinks"],
    tags: ["refreshing", "dry", "citrusy"],
    reason: "approachable, crowd-safe flavours for a work event",
  },
  {
    label: "Client Entertainment",
    keywords: ["client", "client dinner", "client drinks", "business dinner", "client entertainment"],
    tags: ["dry", "bitter", "herbal"],
    reason: "polished, impressive flavours for client entertainment",
  },
  {
    label: "Launch Party",
    keywords: ["launch", "launch party", "product launch", "opening night", "grand opening"],
    tags: ["sweet", "tangy", "citrusy"],
    reason: "exciting, celebratory profile for a launch event",
  },
  // ── Venue & Setting ───────────────────────────────────────────────────────
  {
    label: "Rooftop Bar",
    keywords: ["rooftop", "sky bar", "rooftop bar", "sundowner", "sunset drinks"],
    tags: ["citrusy", "refreshing", "dry"],
    reason: "crisp, refreshing drinks suited to a rooftop setting",
  },
  {
    label: "Speakeasy",
    keywords: ["speakeasy", "prohibition", "underground bar", "bootleg"],
    tags: ["boozy", "bitter", "dry"],
    reason: "a classic, spirit-forward prohibition-era character",
  },
  {
    label: "Wine Bar",
    keywords: ["wine bar", "wine and cheese", "cellar door", "vineyard", "winery"],
    tags: ["dry", "floral", "earthy"],
    reason: "wine-bar-friendly complexity and elegance",
  },
  {
    label: "Tiki Bar",
    keywords: ["tiki", "tiki bar", "tiki night", "polynesian"],
    tags: ["fruity", "sweet", "citrusy"],
    reason: "exotic tropical sweetness and citrus for a tiki bar",
  },
  {
    label: "Beer Garden",
    keywords: ["beer garden", "pub garden", "outdoor pub", "garden bar"],
    tags: ["refreshing", "citrusy", "earthy"],
    reason: "refreshing, sessionable flavours for a beer garden afternoon",
  },
  {
    label: "Day Club / Pool Party",
    keywords: ["day club", "day party", "pool party", "day rave"],
    tags: ["refreshing", "citrusy", "fruity"],
    reason: "light, refreshing flavours made for a day party",
  },
  {
    label: "BBQ",
    keywords: ["bbq", "barbecue", "cookout", "backyard", "grill", "sausage sizzle"],
    tags: ["refreshing", "citrusy", "earthy"],
    reason: "crisp, refreshing flavours that pair with outdoor grilling",
  },
  {
    label: "Camping / Outdoors",
    keywords: ["camping", "campfire", "outdoors", "bushcraft", "hiking", "national park"],
    tags: ["smoky", "earthy", "herbal"],
    reason: "rugged, earthy character for an outdoor setting",
  },
  {
    label: "Yacht / Boat Party",
    keywords: ["yacht", "boat party", "sailing", "boat drinks", "nautical", "on the water"],
    tags: ["citrusy", "refreshing", "dry"],
    reason: "crisp, sea-breeze-fresh flavours for time on the water",
  },
  {
    label: "Holiday",
    keywords: ["holiday", "vacation", "resort", "cruise", "getaway", "travel"],
    tags: ["fruity", "refreshing", "citrusy"],
    reason: "carefree, holiday-mode refreshment",
  },
  // ── Food & Drink Events ───────────────────────────────────────────────────
  {
    label: "Fiesta",
    keywords: ["fiesta", "taco night", "margarita night", "mexican night"],
    tags: ["citrusy", "spicy", "sour"],
    reason: "zesty, spiced fiesta character",
  },
  {
    label: "Italian Night",
    keywords: ["italian", "italian night", "pasta night", "aperitivo", "antipasto"],
    tags: ["bitter", "citrusy", "dry"],
    reason: "crisp, aperitivo-style bitterness and citrus for an Italian evening",
  },
  {
    label: "French Night",
    keywords: ["french", "parisian", "france", "bastille", "french night"],
    tags: ["floral", "dry", "bitter"],
    reason: "Parisian elegance — floral, dry, and refined",
  },
  {
    label: "Asian Night",
    keywords: ["asian night", "japanese night", "sake night", "sushi night", "asian cuisine"],
    tags: ["herbal", "citrusy", "sweet"],
    reason: "delicate herbal and citrus notes complementing Asian cuisine",
  },
  {
    label: "Indian Night",
    keywords: ["indian night", "curry night", "bollywood", "indian food"],
    tags: ["spicy", "sweet", "fruity"],
    reason: "bold spice and sweetness to complement Indian flavours",
  },
  {
    label: "Cheese & Charcuterie Night",
    keywords: ["cheese", "charcuterie", "cheese board", "wine and cheese", "antipasto"],
    tags: ["dry", "herbal", "bitter"],
    reason: "dry, savoury complexity that pairs with cheese and charcuterie",
  },
  {
    label: "Dessert Night",
    keywords: ["dessert", "sweets night", "sweet night", "dessert party", "bake off"],
    tags: ["sweet", "creamy", "fruity"],
    reason: "indulgent, dessert-friendly sweetness",
  },
  {
    label: "Cocktail Tasting",
    keywords: ["cocktail tasting", "tasting night", "cocktail masterclass", "mixology"],
    tags: ["bitter", "dry", "herbal"],
    reason: "complexity and nuance suited to a cocktail tasting",
  },
  // ── Relaxed / Personal ────────────────────────────────────────────────────
  {
    label: "Self-Care Night",
    keywords: ["self care", "pamper", "spa night", "relaxing night", "bath night", "me time"],
    tags: ["floral", "sweet", "fruity"],
    reason: "gentle, soothing sweetness and florals for a self-care evening",
  },
  {
    label: "Solo Night In",
    keywords: ["solo", "alone", "by myself", "just me", "night alone"],
    tags: ["refreshing", "sweet", "fruity"],
    reason: "a personal, treat-yourself profile for a solo night",
  },
  {
    label: "Afternoon Drinks",
    keywords: ["afternoon", "afternoon drinks", "afternoon tea", "long lunch", "sunday arvo", "arvo"],
    tags: ["refreshing", "citrusy", "floral"],
    reason: "light, sessionable refreshment for a leisurely afternoon",
  },
  {
    label: "Sundowner",
    keywords: ["sundowner", "sunset", "golden hour", "sundown"],
    tags: ["citrusy", "refreshing", "dry"],
    reason: "a crisp, golden-hour profile for sundowner drinks",
  },
]

// Exported so the placeholder cycling can pull real occasion labels
export const ALL_OCCASION_LABELS = OCCASION_THEMES.map((t) => t.label)

export function inferOccasionTags(
  query: string,
): { label: string | null; tags: FlavorTag[]; reason: string } {
  const lower = query.toLowerCase()
  for (const theme of OCCASION_THEMES) {
    if (theme.keywords.some((k) => lower.includes(k))) {
      return { label: theme.label, tags: theme.tags, reason: theme.reason }
    }
  }
  // Use the user's own wording rather than "an occasion I don't recognise"
  const trimmed = query.trim()
  const reason = trimmed
    ? `the energy of ${trimmed}`
    : "a broadly crowd-pleasing, refreshing profile"
  return {
    label: null,
    tags: ["refreshing", "sweet", "citrusy"],
    reason,
  }
}
