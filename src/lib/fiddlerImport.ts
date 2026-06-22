import type { FlavorTag, GlassType, IngredientCategory, StyleTag } from "../types"

// One-time seed data transcribed from "Fiddler Cocktail Menu 2027.pdf" — every
// recipe with a full ingredient list in that document. Quantities and build
// steps live in each experiment's notes (the data model only tracks which
// ingredients are used, not amounts). "Mango Daiquiri" is referenced in the
// document's prebatch colour key but has no recipe card, so it's excluded
// rather than guessed.

export interface SeedIngredient {
  name: string
  category: IngredientCategory
  tags: FlavorTag[]
  styles: StyleTag[]
}

export const SEED_INGREDIENTS: SeedIngredient[] = [
  // Spirits & liqueurs
  { name: "Gray Goose vodka", category: "spirit", tags: ["boozy"], styles: ["martini-stirred"] },
  { name: "Elderflower liqueur", category: "spirit", tags: ["floral", "sweet"], styles: ["fizz-effervescent", "martini-stirred"] },
  { name: "Bombay Sapphire gin", category: "spirit", tags: ["boozy", "herbal"], styles: ["martini-stirred", "classic-spirit-forward"] },
  { name: "Cointreau", category: "spirit", tags: ["citrusy", "sweet"], styles: ["citrus-forward", "classic-spirit-forward"] },
  { name: "Chambord", category: "spirit", tags: ["sweet", "fruity"], styles: ["martini-stirred", "creamy-dessert"] },
  { name: "Patron Silver tequila", category: "spirit", tags: ["boozy", "citrusy"], styles: ["citrus-forward", "classic-spirit-forward"] },
  { name: "Absolut Vanilla vodka", category: "spirit", tags: ["sweet", "boozy"], styles: ["creamy-dessert", "martini-stirred"] },
  { name: "De Kyper passionfruit liqueur", category: "spirit", tags: ["fruity", "sweet"], styles: ["tropical-tiki", "martini-stirred"] },
  { name: "42 Below vodka", category: "spirit", tags: ["boozy"], styles: ["martini-stirred", "fizz-effervescent"] },
  { name: "Kahlua", category: "spirit", tags: ["sweet", "bitter"], styles: ["creamy-dessert"] },
  { name: "Disaronno", category: "spirit", tags: ["sweet", "nutty"], styles: ["classic-spirit-forward"] },
  { name: "Canadian Club whiskey", category: "spirit", tags: ["boozy", "sweet"], styles: ["classic-spirit-forward"] },
  { name: "Angels Envy whiskey", category: "spirit", tags: ["boozy", "sweet"], styles: ["classic-spirit-forward"] },
  { name: "Woodford Reserve whiskey", category: "spirit", tags: ["boozy", "bitter"], styles: ["classic-spirit-forward", "herbal-bitter"] },
  { name: "Bacardi rum", category: "spirit", tags: ["sweet", "boozy"], styles: ["tropical-tiki", "refreshing-highball"] },
  { name: "Bacardi coconut rum", category: "spirit", tags: ["sweet", "creamy"], styles: ["tropical-tiki"] },
  { name: "Cazadores tequila", category: "spirit", tags: ["boozy"], styles: ["classic-spirit-forward"] },
  { name: "Strawberry De Kyper liqueur", category: "spirit", tags: ["fruity", "sweet"], styles: ["tropical-tiki", "refreshing-highball"] },
  { name: "Lyre's white cane spirit", category: "spirit", tags: ["refreshing"], styles: ["refreshing-highball"] },
  { name: "Blue curacao liqueur", category: "spirit", tags: ["citrusy", "sweet"], styles: ["tropical-tiki", "fizz-effervescent"] },
  { name: "Lychee paraiso liqueur", category: "spirit", tags: ["floral", "sweet"], styles: ["fizz-effervescent"] },
  { name: "Limoncello", category: "spirit", tags: ["citrusy", "sweet"], styles: ["citrus-forward", "fizz-effervescent"] },
  { name: "Pink gin", category: "spirit", tags: ["floral", "fruity"], styles: ["fizz-effervescent"] },
  { name: "Aperol aperitivo", category: "spirit", tags: ["bitter", "citrusy"], styles: ["fizz-effervescent", "herbal-bitter"] },

  // Citrus
  { name: "Lemon juice", category: "citrus", tags: ["sour", "citrusy", "tangy"], styles: ["citrus-forward", "refreshing-highball"] },
  { name: "Lime juice", category: "citrus", tags: ["sour", "citrusy", "tangy"], styles: ["citrus-forward", "refreshing-highball", "tropical-tiki"] },

  // Sweeteners (syrups)
  { name: "Rose syrup", category: "sweetener", tags: ["sweet", "floral"], styles: ["martini-stirred"] },
  { name: "Apple syrup", category: "sweetener", tags: ["sweet", "fruity"], styles: ["martini-stirred"] },
  { name: "Vanilla syrup", category: "sweetener", tags: ["sweet"], styles: ["creamy-dessert", "martini-stirred"] },
  { name: "Sugar syrup", category: "sweetener", tags: ["sweet"], styles: ["classic-spirit-forward", "citrus-forward", "refreshing-highball", "tropical-tiki"] },
  { name: "Hibiscus syrup", category: "sweetener", tags: ["sweet", "floral", "tangy"], styles: ["martini-stirred", "tropical-tiki"] },
  { name: "Caramel syrup", category: "sweetener", tags: ["sweet"], styles: ["creamy-dessert"] },
  { name: "Mango syrup", category: "sweetener", tags: ["sweet", "fruity"], styles: ["tropical-tiki"] },
  { name: "Pomegranate syrup", category: "sweetener", tags: ["sweet", "tangy"], styles: ["tropical-tiki"] },
  { name: "Raspberry syrup", category: "sweetener", tags: ["sweet", "fruity"], styles: ["tropical-tiki"] },
  { name: "Butterfly pea syrup", category: "sweetener", tags: ["sweet"], styles: ["tropical-tiki"] },

  // Mixers
  { name: "Lychee juice", category: "mixer", tags: ["fruity", "sweet"], styles: ["martini-stirred"] },
  { name: "Passionfruit puree", category: "mixer", tags: ["fruity", "tangy"], styles: ["tropical-tiki", "martini-stirred"] },
  { name: "Passionfruit pulp", category: "mixer", tags: ["fruity", "tangy"], styles: ["tropical-tiki"] },
  { name: "Espresso mix", category: "mixer", tags: ["bitter", "boozy"], styles: ["creamy-dessert"] },
  { name: "Prosecco", category: "mixer", tags: ["refreshing", "citrusy"], styles: ["fizz-effervescent"] },
  { name: "Coconut cream", category: "mixer", tags: ["creamy", "sweet"], styles: ["tropical-tiki", "creamy-dessert"] },
  { name: "Heavy cream", category: "mixer", tags: ["creamy"], styles: ["creamy-dessert"] },
  { name: "Soda water", category: "mixer", tags: ["refreshing"], styles: ["refreshing-highball", "fizz-effervescent"] },
  { name: "Lemonade", category: "mixer", tags: ["sweet", "citrusy", "refreshing"], styles: ["refreshing-highball", "fizz-effervescent"] },
  { name: "Coca-cola", category: "mixer", tags: ["sweet"], styles: ["refreshing-highball"] },
  { name: "Pineapple juice", category: "mixer", tags: ["fruity", "sweet", "tangy"], styles: ["tropical-tiki"] },
  { name: "Cranberry juice", category: "mixer", tags: ["tangy", "sour"], styles: ["tropical-tiki", "refreshing-highball"] },
  { name: "Mango puree", category: "mixer", tags: ["fruity", "sweet"], styles: ["tropical-tiki"] },
  { name: "Apple juice", category: "mixer", tags: ["fruity", "sweet"], styles: ["refreshing-highball"] },
  { name: "Pink moscatto", category: "mixer", tags: ["sweet", "floral"], styles: ["fizz-effervescent"] },

  // Top-up / other
  { name: "Egg whites", category: "other", tags: ["creamy"], styles: ["classic-spirit-forward"] },
  { name: "Bitters", category: "other", tags: ["bitter"], styles: ["classic-spirit-forward", "herbal-bitter"] },
]

export interface SeedExperiment {
  name: string
  glass: GlassType
  garnish: string
  notes: string
  ingredientNames: string[]
  tags: FlavorTag[]
}

export const SEED_EXPERIMENTS: SeedExperiment[] = [
  {
    name: "Lychee Rose",
    glass: "coupe",
    garnish: "Lychee skewer",
    notes: "45ml Gray Goose vodka, 15ml elderflower liqueur, 30ml lychee juice, 20ml rose syrup, 15ml lemon juice. Wet shake & double strain into coupe.",
    ingredientNames: ["Gray Goose vodka", "Elderflower liqueur", "Lychee juice", "Rose syrup", "Lemon juice"],
    tags: ["floral", "fruity", "sweet"],
  },
  {
    name: "Appletini",
    glass: "coupe",
    garnish: "Dehydrated apple",
    notes: "30ml Bombay Sapphire gin, 30ml cointreau, 30ml apple syrup, 30ml lemon juice, 10ml vanilla syrup. Wet shake & double strain into coupe.",
    ingredientNames: ["Bombay Sapphire gin", "Cointreau", "Apple syrup", "Lemon juice", "Vanilla syrup"],
    tags: ["sweet", "fruity", "citrusy"],
  },
  {
    name: "French Kiss",
    glass: "coupe",
    garnish: "Fresh flowers",
    notes: "30ml Bombay Sapphire gin, 30ml Chambord, 30ml egg whites, 30ml lemon juice, 15ml hibiscus syrup. Wet shake & double strain into coupe.",
    ingredientNames: ["Bombay Sapphire gin", "Chambord", "Egg whites", "Lemon juice", "Hibiscus syrup"],
    tags: ["sour", "fruity", "floral"],
  },
  {
    name: "Classic Margarita",
    glass: "coupe",
    garnish: "Dehydrated lemon",
    notes: "45ml Patron Silver tequila, 15ml cointreau, 30ml lime juice, 15ml sugar syrup. Wet shake & double strain into coupe.",
    ingredientNames: ["Patron Silver tequila", "Cointreau", "Lime juice", "Sugar syrup"],
    tags: ["sour", "citrusy", "tangy"],
  },
  {
    name: "Pornstar Martini",
    glass: "coupe",
    garnish: "Dehydrated lemon",
    notes: "30ml Absolut Vanilla vodka, 30ml passionfruit De Kyper liqueur, 30ml passionfruit puree, 20ml lemon juice, 15ml vanilla syrup. Wet shake & double strain into coupe. Top up with prosecco.",
    ingredientNames: ["Absolut Vanilla vodka", "De Kyper passionfruit liqueur", "Passionfruit puree", "Lemon juice", "Vanilla syrup", "Prosecco"],
    tags: ["sweet", "fruity", "refreshing"],
  },
  {
    name: "Espresso Martini",
    glass: "coupe",
    garnish: "3 coffee beans",
    notes: "45ml 42 Below vodka, 15ml Kahlua, 60ml espresso mix, 30ml sugar syrup. Wet shake & double strain into coupe.",
    ingredientNames: ["42 Below vodka", "Kahlua", "Espresso mix", "Sugar syrup"],
    tags: ["bitter", "sweet", "boozy"],
  },
  {
    name: "Caramel Espresso Martini",
    glass: "lowball",
    garnish: "3 coffee beans",
    notes: "45ml 42 Below vodka, 15ml Kahlua, 30ml espresso premix, 15ml sugar syrup. Wet shake & double strain into glass. Fill slightly with ice. Whip up caramel syrup & heavy cream and top up glass.",
    ingredientNames: ["42 Below vodka", "Kahlua", "Espresso mix", "Sugar syrup", "Caramel syrup", "Heavy cream"],
    tags: ["sweet", "creamy", "bitter"],
  },
  {
    name: "Amber Twilight",
    glass: "lowball",
    garnish: "Dehydrated orange",
    notes: "30ml Patron Silver, 15ml passionfruit De Kyper, 15ml elderflower liqueur, 30ml passionfruit puree, 20ml lemon juice. Wet shake & single strain into short glass. 30ml passionfruit pulp, 20ml butterfly pea syrup on top. Top up with ice and DO NOT stir.",
    ingredientNames: ["Patron Silver tequila", "De Kyper passionfruit liqueur", "Elderflower liqueur", "Passionfruit puree", "Lemon juice", "Passionfruit pulp", "Butterfly pea syrup"],
    tags: ["fruity", "floral", "tangy"],
  },
  {
    name: "Amaretto Sour",
    glass: "lowball",
    garnish: "Cherry & rosemary sprig",
    notes: "45ml Disaronno, 15ml Canadian Club whiskey, 30ml lemon juice, 15ml sugar syrup, 15ml egg whites. Dry then wet shake & double strain into glass. Top up with ice.",
    ingredientNames: ["Disaronno", "Canadian Club whiskey", "Lemon juice", "Sugar syrup", "Egg whites"],
    tags: ["sour", "sweet", "boozy"],
  },
  {
    name: "Whiskey Sour",
    glass: "lowball",
    garnish: "Dried lemon & rosemary",
    notes: "60ml Angels Envy whiskey, 30ml lemon juice, 15ml sugar syrup, 15ml egg whites. Dry then wet shake & double strain into glass. Top up with ice.",
    ingredientNames: ["Angels Envy whiskey", "Lemon juice", "Sugar syrup", "Egg whites"],
    tags: ["sour", "boozy", "citrusy"],
  },
  {
    name: "Old Fashioned",
    glass: "lowball",
    garnish: "Zesty orange peel",
    notes: "60ml Woodford Reserve whiskey, 15ml sugar syrup, 3 drops of bitters & orange zest. Spoon mix in a shaker with ice and single strain into glass. Top up with ice.",
    ingredientNames: ["Woodford Reserve whiskey", "Sugar syrup", "Bitters"],
    tags: ["boozy", "bitter", "sweet"],
  },
  {
    name: "Pink Coco",
    glass: "lowball",
    garnish: "Dehydrated lemon",
    notes: "45ml Patron Silver tequila, 15ml cointreau, 30ml lime juice, 30ml hibiscus syrup, 30ml coconut cream. Wet shake & double strain into short glass. Top up with ice.",
    ingredientNames: ["Patron Silver tequila", "Cointreau", "Lime juice", "Hibiscus syrup", "Coconut cream"],
    tags: ["sweet", "creamy", "tangy"],
  },
  {
    name: "Jalapeno Spice Margarita",
    glass: "lowball",
    garnish: "Fresh jalapeno & lime wheel",
    notes: "45ml Patron Silver tequila, 15ml cointreau, 30ml passionfruit puree, 30ml lime juice, 15ml sugar syrup. Muddle 3-4 jalapenos in the shaker. Wet shake & double strain into short glass. Top up with ice.",
    ingredientNames: ["Patron Silver tequila", "Cointreau", "Passionfruit puree", "Lime juice", "Sugar syrup"],
    tags: ["spicy", "tangy", "fruity"],
  },
  {
    name: "Limoncello Spritz",
    glass: "wine glass",
    garnish: "Lemon wheel & rosemary",
    notes: "Build in a wine glass: 30ml limoncello, 30ml 42 Below vodka, 30ml lemon juice, 15ml sugar syrup. Add 1 lemon slice inside glass & 1 on the rim. Top up with ice & lemonade.",
    ingredientNames: ["Limoncello", "42 Below vodka", "Lemon juice", "Sugar syrup", "Lemonade"],
    tags: ["citrusy", "sweet", "refreshing"],
  },
  {
    name: "Pretty in Pink",
    glass: "wine glass",
    garnish: "Fresh raspberry skewer",
    notes: "Build in a wine glass: 60ml pink gin, 90ml prosecco, 10ml lemon juice. Add raspberries & blueberries inside glass. Top up with ice & lemonade.",
    ingredientNames: ["Pink gin", "Prosecco", "Lemon juice", "Lemonade"],
    tags: ["floral", "fruity", "refreshing"],
  },
  {
    name: "Hugo Spritz",
    glass: "wine glass",
    garnish: "Lemon wheel & mint sprig",
    notes: "Build in a wine glass: 60ml elderflower liqueur, 90ml prosecco, 15ml lemon juice, 15ml sugar syrup. Add mint & a lemon wheel inside the glass. Top up with ice & soda water.",
    ingredientNames: ["Elderflower liqueur", "Prosecco", "Lemon juice", "Sugar syrup", "Soda water"],
    tags: ["floral", "refreshing", "citrusy"],
  },
  {
    name: "Aperol Spritz",
    glass: "wine glass",
    garnish: "Fresh orange slice",
    notes: "Build in a wine glass: 60ml Aperol aperitivo, 90ml prosecco. Add 1 orange inside glass & 1 on the rim. Top up with ice & soda water.",
    ingredientNames: ["Aperol aperitivo", "Prosecco", "Soda water"],
    tags: ["bitter", "refreshing", "citrusy"],
  },
  {
    name: "Strawberry Mojito",
    glass: "highball",
    garnish: "Mint sprig",
    notes: "Build in a tall glass: 45ml Bacardi rum, 15ml strawberry De Kyper liqueur, 20ml lime juice, 15ml sugar syrup. Muddle 2-3 limes & fresh mint & strawberries. Top up with ice & soda water.",
    ingredientNames: ["Bacardi rum", "Strawberry De Kyper liqueur", "Lime juice", "Sugar syrup", "Soda water"],
    tags: ["fruity", "refreshing", "tangy"],
  },
  {
    name: "Passionfruit Mojito",
    glass: "highball",
    garnish: "Mint sprig",
    notes: "Build in a tall glass: 45ml Bacardi rum, 15ml passionfruit De Kyper liqueur, 30ml passionfruit pulp, 20ml lime juice, 15ml sugar syrup. Muddle 2-3 limes & fresh mint in the glass. Top up with ice & soda water.",
    ingredientNames: ["Bacardi rum", "De Kyper passionfruit liqueur", "Passionfruit pulp", "Lime juice", "Sugar syrup", "Soda water"],
    tags: ["fruity", "refreshing", "tangy"],
  },
  {
    name: "Classic Mojito",
    glass: "highball",
    garnish: "Mint sprig",
    notes: "Build in a tall glass: 60ml Bacardi rum, 20ml lime juice, 15ml sugar syrup. Muddle 2-3 limes & fresh mint in the glass. Top up with ice & soda water.",
    ingredientNames: ["Bacardi rum", "Lime juice", "Sugar syrup", "Soda water"],
    tags: ["refreshing", "herbal", "tangy"],
  },
  {
    name: "Pina Colada",
    glass: "highball",
    garnish: "Fresh pineapple wedge",
    notes: "60ml coconut Bacardi rum, 60ml pineapple juice, 30ml coconut cream, 30ml lemon juice, 15ml sugar syrup. Wet shake & single strain into glass. Top up with ice.",
    ingredientNames: ["Bacardi coconut rum", "Pineapple juice", "Coconut cream", "Lemon juice", "Sugar syrup"],
    tags: ["sweet", "creamy", "fruity"],
  },
  {
    name: "Long Island Iced Tea",
    glass: "highball",
    garnish: "Dehydrated orange",
    notes: "Build in a tall glass: 15ml Bacardi rum, 15ml cointreau, 15ml Bombay Sapphire gin, 15ml Cazadores tequila, 20ml lime juice, 15ml sugar syrup. Top up with ice & coca-cola.",
    ingredientNames: ["Bacardi rum", "Cointreau", "Bombay Sapphire gin", "Cazadores tequila", "Lime juice", "Sugar syrup", "Coca-cola"],
    tags: ["boozy", "tangy", "sweet"],
  },
  {
    name: "Virgin Strawberry Mojito",
    glass: "mason jar",
    garnish: "Fresh mint sprig",
    notes: "Build in a mason jar: 60ml Lyre's white cane spirit (non-alcoholic), 20ml lime juice, 15ml sugar syrup. Muddle 2-3 limes & fresh mint & strawberries. Top up with ice & soda water / lemonade.",
    ingredientNames: ["Lyre's white cane spirit", "Lime juice", "Sugar syrup", "Soda water"],
    tags: ["refreshing", "tangy", "fruity"],
  },
  {
    name: "Virgin Passionfruit Mojito",
    glass: "mason jar",
    garnish: "Fresh mint sprig",
    notes: "Build in a mason jar: 60ml Lyre's white cane spirit (non-alcoholic), 30ml passionfruit puree, 20ml lime juice, 15ml sugar syrup. Muddle 2-3 limes & fresh mint in the glass. Top up with ice & soda water / lemonade.",
    ingredientNames: ["Lyre's white cane spirit", "Passionfruit puree", "Lime juice", "Sugar syrup", "Soda water"],
    tags: ["refreshing", "tangy", "fruity"],
  },
  {
    name: "Virgin Classic Mojito",
    glass: "mason jar",
    garnish: "Fresh mint sprig",
    notes: "Build in a mason jar: 60ml Lyre's white cane spirit (non-alcoholic), 20ml lime juice, 15ml sugar syrup. Muddle 2-3 limes & fresh mint in the glass. Top up with ice & soda water / lemonade.",
    ingredientNames: ["Lyre's white cane spirit", "Lime juice", "Sugar syrup", "Soda water"],
    tags: ["refreshing", "tangy", "herbal"],
  },
  {
    name: "Raspberry Passion",
    glass: "mason jar",
    garnish: "Dehydrated lemon",
    notes: "Build in a mason jar: 30ml raspberry syrup, 30ml passionfruit puree, 20ml lemon juice. Muddle fresh raspberries in the glass. Top up with ice & soda water.",
    ingredientNames: ["Raspberry syrup", "Passionfruit puree", "Lemon juice", "Soda water"],
    tags: ["sweet", "fruity", "tangy"],
  },
  {
    name: "Summer Bliss",
    glass: "mason jar",
    garnish: "Dehydrated orange",
    notes: "Build in a mason jar: 60ml mango puree, 60ml apple juice, 30ml passionfruit pulp, 15ml lime juice, 15ml sugar syrup. Top up with ice & lemonade.",
    ingredientNames: ["Mango puree", "Apple juice", "Passionfruit pulp", "Lime juice", "Sugar syrup", "Lemonade"],
    tags: ["sweet", "fruity", "tangy"],
  },
  {
    name: "Cran-Mango",
    glass: "mason jar",
    garnish: "Dehydrated orange",
    notes: "Build in a mason jar: 45ml cranberry juice, 30ml mango syrup, 30ml pomegranate syrup, 20ml lime juice. Top up with ice & soda water.",
    ingredientNames: ["Cranberry juice", "Mango syrup", "Pomegranate syrup", "Lime juice", "Soda water"],
    tags: ["tangy", "sweet", "fruity"],
  },
  {
    name: "Bad 'n' Blujee",
    glass: "carafe",
    garnish: "Two sour strap skewers",
    notes: "Build in a carafe (jug): 60ml 42 Below vodka, 30ml blue curacao liqueur, 30ml passionfruit De Kyper, 30ml lime juice. Top up with ice & lemonade.",
    ingredientNames: ["42 Below vodka", "Blue curacao liqueur", "De Kyper passionfruit liqueur", "Lime juice", "Lemonade"],
    tags: ["sweet", "tangy", "fruity"],
  },
  {
    name: "I Lycke You",
    glass: "carafe",
    garnish: "",
    notes: "Build in a carafe (jug): 60ml lychee paraiso liqueur, 60ml 42 Below vodka, 150ml pink moscatto. Add 3-4 lychees & fresh strawberries in jug. Top up with ice & lemonade.",
    ingredientNames: ["Lychee paraiso liqueur", "42 Below vodka", "Pink moscatto", "Lemonade"],
    tags: ["sweet", "fruity", "floral"],
  },
  {
    name: "Golden Hour",
    glass: "carafe",
    garnish: "",
    notes: "Build in a carafe (jug): 60ml Bacardi rum, 30ml Bacardi coconut rum, 30ml cointreau, 40ml lemon juice, 40ml mango syrup, 30ml mango puree. Top up with ice & lemonade.",
    ingredientNames: ["Bacardi rum", "Bacardi coconut rum", "Cointreau", "Lemon juice", "Mango syrup", "Mango puree", "Lemonade"],
    tags: ["sweet", "fruity", "citrusy"],
  },
]
