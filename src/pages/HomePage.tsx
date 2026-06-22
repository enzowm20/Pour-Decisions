import { Link } from "react-router-dom"
import logoLimoncelloHero from "../assets/logo-limoncello-hero.png"
import limoncelloBottle from "../assets/limoncello-bottle.webp"
import FallingBottles from "../components/FallingBottles"
import RevealOnScroll from "../components/RevealOnScroll"

const SECTIONS = [
  {
    label: "Administration",
    description: "Keep the bar's actual inventory and competitor research up to date.",
    items: [
      {
        to: "/stock",
        name: "Stock",
        blurb: "Every spirit, mixer, citrus, sweetener, and top-up you carry, tagged by flavor and cocktail style.",
      },
      {
        to: "/venues",
        name: "Venue Scans",
        blurb: "Log other venues' menus and see each drink's makeable / swap / purchase status against your stock.",
      },
    ],
  },
  {
    label: "Experimentation",
    description: "Where new cocktail ideas get built and the record of what's been tried lives.",
    items: [
      {
        to: "/lab",
        name: "Experiment Lab",
        blurb: "Pick flavor tags and get new combinations built from what's actually in stock — never something already on file.",
      },
      {
        to: "/archive",
        name: "Archive",
        blurb: "Outcome, glass, garnish, photos — everything you've tried. The lab learns from what's marked worked here.",
      },
    ],
  },
  {
    label: "Menu",
    description: "The customer-facing list, managed by you and your staff.",
    items: [
      {
        to: "/menu",
        name: "My Menu",
        blurb: "Cocktails promoted from the Archive, split into core and seasonal, with cost and margin tracked per drink.",
      },
    ],
  },
]

export default function HomePage() {
  return (
    <div className="relative space-y-10 text-center">
      <FallingBottles bottleImg={limoncelloBottle} />

      <RevealOnScroll className="flex justify-center pt-2">
        <img
          src={logoLimoncelloHero}
          alt="Pour Decisions — match, mix, sip"
          className="h-56 w-auto sm:h-80 md:h-96"
        />
      </RevealOnScroll>

      <RevealOnScroll delay={100}>
        <h1 className="mb-2 text-lg font-medium">Match. Mix. Sip.</h1>
        <p className="mx-auto max-w-xl text-sm text-[var(--cream-dim)]">
          A bartender's working system for stock, competitor menus, new cocktail ideas, and the
          archive of everything you've actually tried — staff only below.
        </p>
      </RevealOnScroll>

      <div className="space-y-8 text-left">
        {SECTIONS.map((section, i) => (
          <RevealOnScroll key={section.label} delay={i * 80}>
            <p className="mb-1 text-sm font-medium text-[var(--primary)]">{section.label}</p>
            <p className="mb-3 text-xs text-[var(--cream-dim)]">{section.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] p-4 transition hover:border-[var(--primary)]/60"
                >
                  <p className="mb-1 text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-[var(--cream-dim)]">{item.blurb}</p>
                </Link>
              ))}
            </div>
          </RevealOnScroll>
        ))}
      </div>

      <RevealOnScroll className="border-t border-[var(--cream-dim)]/15 pt-6 text-left">
        <p className="mb-1 text-sm font-medium text-[var(--primary)]">Public Menu</p>
        <p className="mb-3 text-xs text-[var(--cream-dim)]">
          A view-only menu with no staff controls or sign-in — share this link with guests, not
          the staff links above.
        </p>
        <a
          href="/public-menu"
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface-raised)] px-4 py-2 text-sm hover:border-[var(--primary)]/60"
        >
          Open /public-menu ↗
        </a>
      </RevealOnScroll>
    </div>
  )
}
