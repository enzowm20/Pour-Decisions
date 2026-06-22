import { useLayoutEffect } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import DrainingBackground from "./DrainingBackground"
import { themeForPath, type ThemeName } from "../lib/theme"
import { staffLogout } from "../lib/auth"
import logoAperol from "../assets/logo-aperol.png"
import logoChambord from "../assets/logo-chambord.png"
import logoBombay from "../assets/logo-bombay.png"
import logoJager from "../assets/logo-jager.png"
import logoGordons from "../assets/logo-gordons.png"
import logoLimoncello from "../assets/logo-limoncello.png"

const navGroups = [
  {
    label: "Administration",
    items: [
      { to: "/stock", label: "Stock" },
      { to: "/venues", label: "Venue Scans" },
    ],
  },
  {
    label: "Experimentation",
    items: [
      { to: "/lab", label: "Experiment Lab" },
      { to: "/archive", label: "Archive" },
    ],
  },
  {
    label: "Menu",
    items: [{ to: "/menu", label: "My Cocktails" }],
  },
]

const LOGOS: Record<ThemeName, string> = {
  limoncello: logoLimoncello,
  aperol: logoAperol,
  chambord: logoChambord,
  bombay: logoBombay,
  jager: logoJager,
  gordons: logoGordons,
}

export default function Layout() {
  const location = useLocation()
  const theme = themeForPath(location.pathname)
  const isHome = location.pathname === "/"

  // Each page should start its own drain from full, not inherit scroll
  // position from whichever page you were on before navigating.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  function handleLogout() {
    staffLogout()
    window.location.href = "/"
  }

  return (
    <div className={`theme-${theme} min-h-screen text-[var(--cream)]`}>
      <DrainingBackground />

      {/* Home has its own oversized logo, so skip the header here to avoid
          showing it twice. Every other page gets logo-left, grouped tabs and
          sign-out on the right. */}
      {!isHome && (
        <header className="border-b border-[var(--cream-dim)]/15 bg-[var(--cream)]">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link to="/">
              <img
                src={LOGOS[theme]}
                alt="Pour Decisions — match, mix, sip"
                className="h-24 w-auto sm:h-36"
              />
            </Link>

            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                {navGroups.map((group) => {
                  const isGroupActive = group.items.some((item) =>
                    location.pathname.startsWith(item.to),
                  )
                  return (
                    <div key={group.label} className="group relative">
                      <button
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-sm ${
                          isGroupActive
                            ? theme === "bombay"
                              ? "bg-[var(--gold)] text-[var(--on-gold)]"
                              : "bg-[var(--primary)] text-[var(--on-primary)]"
                            : "text-[var(--surface)] hover:bg-[var(--cream-dim)]/30"
                        }`}
                      >
                        {group.label}
                      </button>

                      {/* CSS-only hover dropdown. top-full with no margin (and
                          pt-1 instead) keeps this flush against the button —
                          a margin gap here is a dead zone the cursor has to
                          cross with nothing hoverable under it, which is what
                          made the dropdown disappear before reaching it. */}
                      <div className="invisible absolute left-0 top-full z-10 min-w-[170px] pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100">
                        <div className="rounded-md border border-[var(--cream-dim)]/20 bg-[var(--cream)] py-1 shadow-md">
                          {group.items.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                `block px-3 py-2 text-sm ${
                                  isActive
                                    ? theme === "bombay"
                                      ? "bg-[var(--gold)] text-[var(--on-gold)]"
                                      : "bg-[var(--primary)] text-[var(--on-primary)]"
                                    : "text-[var(--surface)] hover:bg-[var(--cream-dim)]/30"
                                }`
                              }
                            >
                              {item.label}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-[var(--surface)]/70 hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Opaque panel so page content stays readable as the liquid level
            passes behind it — only the margins around this card reveal the
            draining background. */}
        <div className="rounded-lg border border-[var(--cream-dim)]/15 bg-[var(--surface)] p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
