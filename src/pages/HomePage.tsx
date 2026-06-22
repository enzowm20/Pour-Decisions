import { Link } from "react-router-dom"
import logoLimoncelloHero from "../assets/logo-limoncello-hero.png"
import vanillaBottle from "../assets/vanilla-bottle.webp"
import wildberryBottle from "../assets/wildberry-bottle.webp"
import limeBottle from "../assets/lime-bottle.webp"
import passionfruitBottle from "../assets/passionfruit-bottle.webp"
import raspberryBottle from "../assets/raspberry-bottle.webp"
import FallingBottles from "../components/FallingBottles"

// Home gets its own mixed set of five flavour bottles, distinct from the
// single spirit each other tab is themed around.
const HOME_BOTTLES = [vanillaBottle, wildberryBottle, limeBottle, passionfruitBottle, raspberryBottle]

const TABS = [
  {
    to: "/stock",
    name: "Stock",
    blurb: "Your bar's actual inventory — every spirit, mixer, citrus, sweetener, and top-up, tagged by flavor and cocktail style so the rest of the app knows what you can really make.",
  },
  {
    to: "/venues",
    name: "Venue Scans",
    blurb: "Log other venues' menus — by hand or imported — and see each drink's makeable / swap / purchase status against your own stock, with a shopping list for whatever's missing.",
  },
  {
    to: "/lab",
    name: "Experiment Lab",
    blurb: "Pick flavor tags and get new combinations built from what's actually in stock — never something you've already logged or already have on a menu.",
  },
  {
    to: "/archive",
    name: "Archive",
    blurb: "The record of everything you've tried: outcome, glass, garnish, photos. The lab learns from what you mark as worked here.",
  },
  {
    to: "/menu",
    name: "My Menu",
    blurb: "Cocktails you've promoted from the Archive, split into core and seasonal, with cost and margin tracked per drink.",
  },
]

export default function HomePage() {
  return (
    <div className="relative space-y-10 text-center">
      <FallingBottles bottleImg={HOME_BOTTLES} />

      <div className="flex justify-center pt-2">
        <img
          src={logoLimoncelloHero}
          alt="Pour Decisions — match, mix, sip"
          className="h-56 w-auto sm:h-80 md:h-96"
        />
      </div>

      <div>
        <h1 className="mb-2 text-lg font-medium">Match. Mix. Sip.</h1>
        <p className="mx-auto max-w-xl text-sm text-[var(--cream-dim)]">
          A bartender's working system for stock, competitor menus, new cocktail ideas, and the
          archive of everything you've actually tried — five tabs, one running picture of what
          your bar can pour right now.
        </p>
      </div>

      <div className="grid gap-4 text-left sm:grid-cols-2">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4 transition hover:border-[var(--primary)]/60"
          >
            <p className="mb-1 text-sm font-medium text-[var(--primary)]">{tab.name}</p>
            <p className="text-sm text-[var(--cream-dim)]">{tab.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
