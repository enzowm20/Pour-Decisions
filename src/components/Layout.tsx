import { useLayoutEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import DrainingBackground from "./DrainingBackground"
import { themeForPath, type ThemeName } from "../lib/theme"
import logoAperol from "../assets/logo-aperol.png"
import logoChambord from "../assets/logo-chambord.png"
import logoBombay from "../assets/logo-bombay.png"
import logoJager from "../assets/logo-jager.png"
import logoGordons from "../assets/logo-gordons.png"
import logoLimoncello from "../assets/logo-limoncello.png"

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

  // Each page should start its own drain from full, not inherit scroll
  // position from whichever page you were on before navigating.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className={`theme-${theme} min-h-screen text-[var(--cream)]`}>
      <DrainingBackground />

      {/* Cream strip spans the full header so the logo stays legible
          regardless of which page's dark surface colour sits behind it;
          the logo itself is recoloured per theme below. Clicking it returns
          to Home, which is where navigation between tabs actually lives. */}
      <header className="border-b border-[var(--cream-dim)]/15 bg-[var(--cream)]">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-3">
          <Link to="/">
            <img
              src={LOGOS[theme]}
              alt="Pour Decisions — match, mix, sip"
              className="h-24 w-auto sm:h-36"
            />
          </Link>
        </div>
      </header>

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
