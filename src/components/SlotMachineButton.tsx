import { useCallback, useEffect, useRef, useState } from "react"

interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

// ── SVG cocktail graphics (80×100 viewBox, linework + colour-block) ───────────

const MartiniSVG = () => (<svg viewBox="0 0 80 100" fill="none"><polygon points="20,14 60,14 40,52" fill="#C9E87A" opacity=".85"/><polyline points="8,8 40,58 72,8" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/><line x1="8" y1="8" x2="72" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="58" x2="40" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="82" x2="56" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="40" cy="14" r="5" fill="#5A9E5A" stroke="var(--cream)" strokeWidth="1.5"/><line x1="40" y1="9" x2="40" y2="2" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="40" cy="2" r="2" fill="#E85A5A"/></svg>)
const OldFashionedSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="16" y="42" width="48" height="38" rx="2" fill="#D97B2A" opacity=".85"/><path d="M14 20 L18 80 Q18 82 20 82 L60 82 Q62 82 62 80 L66 20 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="14" y1="20" x2="66" y2="20" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><rect x="24" y="28" width="14" height="14" rx="2" stroke="var(--cream)" strokeWidth="1.8" fill="rgba(200,230,255,.3)"/><rect x="42" y="32" width="12" height="12" rx="2" stroke="var(--cream)" strokeWidth="1.8" fill="rgba(200,230,255,.3)"/><path d="M52 22 Q62 16 60 26" stroke="#E8A44A" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>)
const HighballSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="18" y="44" width="44" height="36" rx="2" fill="#A8D87A" opacity=".8"/><path d="M16 12 L18 82 Q18 84 20 84 L60 84 Q62 84 62 82 L64 12 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="16" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="56" cy="12" r="8" fill="#78C840" stroke="var(--cream)" strokeWidth="1.5"/><line x1="56" y1="4" x2="56" y2="20" stroke="var(--cream)" strokeWidth="1"/><line x1="48" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="1"/><line x1="28" y1="44" x2="28" y2="18" stroke="#4E9A40" strokeWidth="2" strokeLinecap="round"/><ellipse cx="24" cy="30" rx="5" ry="3" fill="#4E9A40" transform="rotate(-30 24 30)"/><ellipse cx="32" cy="24" rx="5" ry="3" fill="#5AB04A" transform="rotate(20 32 24)"/></svg>)
const CoupeSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M16 10 Q16 44 40 48 Q64 44 64 10 Z" fill="#E85A8A" opacity=".8"/><path d="M12 8 Q12 48 40 52 Q68 48 68 8 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="52" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="40" cy="14" r="5" fill="#C0182A" stroke="var(--cream)" strokeWidth="1.5"/><path d="M40 9 Q44 4 48 6" stroke="#4E9A40" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>)
const FluteSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M28 52 L26 80 L54 80 L52 52 Z" fill="#F0D060" opacity=".85"/><path d="M24 8 L26 82 Q26 84 28 84 L52 84 Q54 84 54 82 L56 8 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><path d="M24 8 Q32 12 40 12 Q48 12 56 8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="84" x2="40" y2="92" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="28" y1="92" x2="52" y2="92" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="36" cy="70" r="2" fill="var(--cream)" opacity=".7"/><circle cx="42" cy="60" r="1.5" fill="var(--cream)" opacity=".6"/><circle cx="44" cy="74" r="1.5" fill="var(--cream)" opacity=".6"/></svg>)
const MargaritaSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M20 14 L40 54 L60 14 Z" fill="#78D8B0" opacity=".8"/><polyline points="6,10 40,58 74,10" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/><line x1="6" y1="10" x2="74" y2="10" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="58" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/></svg>)
const WineGlassSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M22 30 Q20 52 40 56 Q60 52 58 30 Z" fill="#C03060" opacity=".8"/><path d="M18 8 Q16 54 40 58 Q64 54 62 8" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="18" y1="8" x2="62" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M40 58 Q36 62 36 70 Q36 76 40 78 Q44 76 44 70 Q44 62 40 58 Z" stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/><line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/></svg>)
const ShotSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M24 38 L26 74 L54 74 L56 38 Z" fill="#D97B2A" opacity=".85"/><path d="M20 28 L24 78 L56 78 L60 28 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="20" y1="28" x2="60" y2="28" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M54 28 L66 18 L68 26 Z" fill="#F0D060" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/></svg>)
const MojitoSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="18" y="48" width="44" height="32" rx="2" fill="#C8F080" opacity=".75"/><path d="M16 12 L18 84 Q18 86 20 86 L60 86 Q62 86 62 84 L64 12 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="16" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="30" y1="48" x2="30" y2="14" stroke="#3A8A30" strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="25" cy="36" rx="6" ry="3.5" fill="#4EA840" transform="rotate(-20 25 36)"/><ellipse cx="34" cy="26" rx="6" ry="3.5" fill="#60C050" transform="rotate(15 34 26)"/><path d="M50 12 Q58 4 62 12" stroke="#78C840" strokeWidth="2" fill="#78C840" opacity=".9" strokeLinecap="round"/></svg>)
const EspressoMartiniSVG = () => (<svg viewBox="0 0 80 100" fill="none"><polygon points="22,18 58,18 40,54" fill="#3A1A08" opacity=".95"/><polyline points="8,8 40,58 72,8" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/><line x1="8" y1="8" x2="72" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="58" x2="40" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="82" x2="56" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="34" cy="14" r="3" fill="#6A3A18" opacity=".9"/><circle cx="40" cy="12" r="3" fill="#6A3A18" opacity=".9"/><circle cx="46" cy="14" r="3" fill="#6A3A18" opacity=".9"/></svg>)
const NegroniSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="16" y="44" width="48" height="36" rx="2" fill="#C83020" opacity=".85"/><path d="M14 20 L18 80 Q18 82 20 82 L60 82 Q62 82 62 80 L66 20 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="14" y1="20" x2="66" y2="20" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><rect x="26" y="28" width="14" height="14" rx="2" stroke="var(--cream)" strokeWidth="1.8" fill="rgba(200,230,255,.3)"/><path d="M56 20 Q66 14 64 26" stroke="#E8A060" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>)
const DaiquiriSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M16 12 Q16 44 40 48 Q64 44 64 12 Z" fill="#E8F8D8" opacity=".8"/><path d="M12 8 Q12 48 40 52 Q68 48 68 8 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="52" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M58 8 Q66 0 70 8" stroke="#78C840" strokeWidth="2" fill="#78C840" opacity=".9" strokeLinecap="round"/></svg>)
const SpritsSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M22 32 Q20 54 40 58 Q60 54 58 32 Z" fill="#F07820" opacity=".8"/><path d="M18 8 Q16 54 40 58 Q64 54 62 8" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="18" y1="8" x2="62" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M40 58 Q36 62 36 70 Q36 76 40 78 Q44 76 44 70 Q44 62 40 58 Z" stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/><line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="56" cy="8" r="9" fill="#F07820" stroke="var(--cream)" strokeWidth="1.5" opacity=".9"/><line x1="56" y1="0" x2="56" y2="16" stroke="var(--cream)" strokeWidth="1"/><line x1="48" y1="8" x2="64" y2="8" stroke="var(--cream)" strokeWidth="1"/></svg>)
const GimletSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M16 12 Q16 44 40 48 Q64 44 64 12 Z" fill="#90E880" opacity=".8"/><path d="M12 8 Q12 48 40 52 Q68 48 68 8 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="52" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="40" cy="14" r="4" fill="#60B840" stroke="var(--cream)" strokeWidth="1.5"/></svg>)
const PalomaSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="18" y="44" width="44" height="36" rx="2" fill="#FFB0C0" opacity=".85"/><path d="M16 12 L18 82 Q18 84 20 84 L60 84 Q62 84 62 82 L64 12 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="16" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M20 12 Q16 4 20 4 Q24 4 24 12" stroke="#FFB040" strokeWidth="2" fill="#FFB040" strokeLinejoin="round"/></svg>)
const MuleSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="14" y="38" width="52" height="40" rx="4" fill="#C87830" opacity=".85"/><rect x="12" y="32" width="56" height="48" rx="6" stroke="var(--cream)" strokeWidth="2.5" fill="none"/><line x1="12" y1="32" x2="68" y2="32" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M68 44 Q80 44 80 56 Q80 68 68 68" stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinecap="round"/><line x1="26" y1="38" x2="26" y2="26" stroke="#4E9A40" strokeWidth="2" strokeLinecap="round"/><ellipse cx="22" cy="22" rx="5" ry="3" fill="#4EA840" transform="rotate(-20 22 22)"/><ellipse cx="30" cy="20" rx="5" ry="3" fill="#60C050" transform="rotate(10 30 20)"/></svg>)
const TomCollinsSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="18" y="46" width="44" height="34" rx="2" fill="#FFE880" opacity=".8"/><path d="M16 12 L18 82 Q18 84 20 84 L60 84 Q62 84 62 82 L64 12 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="16" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="40" cy="12" r="6" fill="#E04040" stroke="var(--cream)" strokeWidth="1.5"/><line x1="40" y1="6" x2="40" y2="0" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round"/></svg>)
const BrambleSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="16" y="44" width="48" height="36" rx="2" fill="#7030A0" opacity=".85"/><path d="M14 20 L18 80 Q18 82 20 82 L60 82 Q62 82 62 80 L66 20 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="14" y1="20" x2="66" y2="20" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><rect x="28" y="28" width="12" height="12" rx="2" stroke="var(--cream)" strokeWidth="1.8" fill="rgba(200,230,255,.3)"/><circle cx="52" cy="24" r="5" fill="#4A1070" stroke="var(--cream)" strokeWidth="1.5"/><circle cx="56" cy="28" r="3.5" fill="#6030A0" stroke="var(--cream)" strokeWidth="1.2"/></svg>)
const PinaColadaSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M16 50 Q18 80 40 84 Q62 80 64 50 Q62 40 40 38 Q18 40 16 50 Z" fill="#FFF0A0" opacity=".85"/><path d="M14 48 Q16 82 40 86 Q64 82 66 48 Q64 36 40 34 Q16 36 14 48 Z" stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/><line x1="40" y1="34" x2="40" y2="14" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><path d="M36 14 Q28 4 24 12 Q22 18 30 18" stroke="#F0C030" strokeWidth="2" fill="#F0C030" strokeLinejoin="round"/><path d="M40 14 Q44 2 50 8 Q54 14 46 16" stroke="#A0C830" strokeWidth="2" fill="#A0C830" strokeLinejoin="round"/></svg>)
const BlueLagoonSVG = () => (<svg viewBox="0 0 80 100" fill="none"><rect x="18" y="44" width="44" height="36" rx="2" fill="#1890E8" opacity=".85"/><path d="M16 12 L18 82 Q18 84 20 84 L60 84 Q62 84 62 82 L64 12 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="16" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="52" cy="12" r="7" fill="#FFD040" stroke="var(--cream)" strokeWidth="1.5"/><line x1="52" y1="5" x2="52" y2="19" stroke="var(--cream)" strokeWidth="1"/><line x1="45" y1="12" x2="59" y2="12" stroke="var(--cream)" strokeWidth="1"/></svg>)
const AviationSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M16 12 Q16 44 40 48 Q64 44 64 12 Z" fill="#9070D0" opacity=".8"/><path d="M12 8 Q12 48 40 52 Q68 48 68 8 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="52" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="40" cy="16" r="4" fill="#E060C0" stroke="var(--cream)" strokeWidth="1.5"/></svg>)
const SidecarSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M16 12 Q16 44 40 48 Q64 44 64 12 Z" fill="#E8B040" opacity=".8"/><path d="M12 8 Q12 48 40 52 Q68 48 68 8 Z" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round"/><line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="52" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/></svg>)
const RumPunchSVG = () => (<svg viewBox="0 0 80 100" fill="none"><path d="M12 36 Q10 70 40 74 Q70 70 68 36 Q66 28 40 26 Q14 28 12 36 Z" fill="#FF6840" opacity=".8"/><path d="M10 34 Q8 72 40 76 Q72 72 70 34 Q68 24 40 22 Q12 24 10 34 Z" stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/><path d="M34 22 Q32 10 24 12 Q20 16 26 20" stroke="#F0C030" strokeWidth="2" fill="#F0C030" strokeLinejoin="round"/><path d="M46 22 Q48 10 56 12 Q60 16 54 20" stroke="#A0C830" strokeWidth="2" fill="#A0C830" strokeLinejoin="round"/></svg>)
const PornstarSVG = () => (<svg viewBox="0 0 80 100" fill="none"><polygon points="20,14 60,14 40,54" fill="#FFB830" opacity=".9"/><polyline points="8,8 40,58 72,8" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/><line x1="8" y1="8" x2="72" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="40" y1="58" x2="40" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="82" x2="56" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="40" cy="14" r="7" fill="#FF8020" stroke="var(--cream)" strokeWidth="1.5"/><circle cx="40" cy="14" r="3" fill="#FFD060"/></svg>)

const COCKTAILS = [
  { id: "martini",    graphic: <MartiniSVG /> },
  { id: "oldfash",   graphic: <OldFashionedSVG /> },
  { id: "highball",  graphic: <HighballSVG /> },
  { id: "coupe",     graphic: <CoupeSVG /> },
  { id: "flute",     graphic: <FluteSVG /> },
  { id: "margarita", graphic: <MargaritaSVG /> },
  { id: "wine",      graphic: <WineGlassSVG /> },
  { id: "shot",      graphic: <ShotSVG /> },
  { id: "mojito",    graphic: <MojitoSVG /> },
  { id: "espresso",  graphic: <EspressoMartiniSVG /> },
  { id: "negroni",   graphic: <NegroniSVG /> },
  { id: "daiquiri",  graphic: <DaiquiriSVG /> },
  { id: "spritz",    graphic: <SpritsSVG /> },
  { id: "gimlet",    graphic: <GimletSVG /> },
  { id: "paloma",    graphic: <PalomaSVG /> },
  { id: "mule",      graphic: <MuleSVG /> },
  { id: "tomcollins",graphic: <TomCollinsSVG /> },
  { id: "bramble",   graphic: <BrambleSVG /> },
  { id: "pinacolada",graphic: <PinaColadaSVG /> },
  { id: "bluelagoon",graphic: <BlueLagoonSVG /> },
  { id: "aviation",  graphic: <AviationSVG /> },
  { id: "sidecar",   graphic: <SidecarSVG /> },
  { id: "rumpunch",  graphic: <RumPunchSVG /> },
  { id: "pornstar",  graphic: <PornstarSVG /> },
]

const N        = COCKTAILS.length  // 24
const ITEM_W   = 152               // px per reel cell
const SET_W    = N * ITEM_W        // 3648 px
const VH       = 148               // viewport height (px)
const SQUARE_W = ITEM_W + 16      // 168 px — square outer width
const EXPAND_MS = 480

// 12 copies = 43 776 px strip; start at copy 5 so items are centred in square mode
// Centre anchor A = (SQUARE_W - ITEM_W) / 2 = 8
// Initial pos so item 0 of copy 5 is centred: A - 5*N*ITEM_W = 8 - 18240 = -18232
const COPY_START = 5
const INITIAL_POS = (SQUARE_W - ITEM_W) / 2 - COPY_START * SET_W  // -18232

const REEL_ITEMS = Array.from({ length: 12 }, () => COCKTAILS).flat()

type Phase = "square" | "retracting" | "expanding" | "spinning" | "landed"

export default function SlotMachineButton({ onClick, disabled, spinning }: Props) {
  const reelRef     = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const posRef      = useRef(INITIAL_POS)
  const speedRef    = useRef(0)          // px / ms, scroll left = positive
  const landingRef  = useRef(false)
  const canLandRef  = useRef(false)
  const wantLandRef = useRef(false)
  const rafRef      = useRef(0)
  const phaseRef    = useRef<Phase>("square")
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([])

  const [expanded,    setExpanded]    = useState(false)
  const [footerLabel, setFooterLabel] = useState<"lucky" | "rolling" | "done">("lucky")
  const [dots,        setDots]        = useState(".")

  // Animated dots while rolling
  useEffect(() => {
    if (footerLabel !== "rolling") { setDots("."); return }
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400)
    return () => clearInterval(id)
  }, [footerLabel])

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms); timersRef.current.push(id); return id
  }
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  // ── rAF loop ─────────────────────────────────────────────────────────────────
  // Centre anchor: x position in viewport where the left edge of the centre item sits
  const getAnchor = () => {
    const vW = viewportRef.current?.offsetWidth ?? SQUARE_W
    return (vW - ITEM_W) / 2
  }

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    landingRef.current = false
    canLandRef.current = false
    wantLandRef.current = false
    speedRef.current   = 0
    setFooterLabel("rolling")
    phaseRef.current   = "spinning"

    // Allow landing after a minimum fast-spin time
    timersRef.current.push(setTimeout(() => {
      canLandRef.current = true
      if (wantLandRef.current) landingRef.current = true
    }, 700))

    const MAX_SPEED  = 1.6   // px/ms
    const ACCEL      = 0.07  // px/ms per frame (16.67ms)
    const FRICTION   = 0.955 // multiplier per frame during deceleration
    const STOP_SPEED = 0.04  // px/ms threshold to snap

    const loop = (t: number, lastT: number) => {
      const dt = Math.min(t - lastT, 50)
      const reel = reelRef.current
      if (!reel) return

      if (landingRef.current) {
        speedRef.current *= Math.pow(FRICTION, dt / 16.67)

        if (speedRef.current > STOP_SPEED) {
          posRef.current -= speedRef.current * dt
          reel.style.transform = `translateX(${posRef.current}px)`
          rafRef.current = requestAnimationFrame(t2 => loop(t2, t))
        } else {
          // Snap the nearest item to the viewport centre
          const A       = getAnchor()
          const N_snap  = Math.round((A - posRef.current) / ITEM_W)
          const snapPos = A - N_snap * ITEM_W
          posRef.current = snapPos
          reel.style.transform = `translateX(${snapPos}px)`
          phaseRef.current = "landed"
          setFooterLabel("done")
        }
      } else {
        // Accelerate to max speed
        speedRef.current = Math.min(speedRef.current + ACCEL * (dt / 16.67), MAX_SPEED)
        posRef.current  -= speedRef.current * dt
        reel.style.transform = `translateX(${posRef.current}px)`

        // Trigger deceleration once canLand + wantLand
        if (canLandRef.current && wantLandRef.current) {
          landingRef.current = true
        }
        rafRef.current = requestAnimationFrame(t2 => loop(t2, t))
      }
    }

    rafRef.current = requestAnimationFrame(t => loop(t, t))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase management ──────────────────────────────────────────────────────────
  const doExpand = useCallback(() => {
    phaseRef.current = "expanding"
    setExpanded(true)
    addTimer(() => startLoop(), EXPAND_MS + 40)
  }, [startLoop]) // eslint-disable-line react-hooks/exhaustive-deps

  const doRetract = useCallback(() => {
    phaseRef.current = "retracting"
    cancelAnimationFrame(rafRef.current)
    // Reset reel to show current item centred in square mode
    const A_square = (SQUARE_W - ITEM_W) / 2
    const N_snap   = Math.round((A_square - posRef.current) / ITEM_W)
    const snapPos  = A_square - N_snap * ITEM_W
    posRef.current = snapPos
    if (reelRef.current) reelRef.current.style.transform = `translateX(${snapPos}px)`
    setExpanded(false)
    addTimer(() => doExpand(), EXPAND_MS + 40)
  }, [doExpand]) // eslint-disable-line react-hooks/exhaustive-deps

  // React when parent sets spinning=true
  useEffect(() => {
    if (!spinning) return
    clearTimers()
    const phase = phaseRef.current
    if (phase === "square")  doExpand()
    if (phase === "landed")  doRetract()
    // mid-animation: just signal we want to land when ready
    if (phase === "spinning") { wantLandRef.current = false; canLandRef.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning])

  // React when parent sets spinning=false (data is ready → allow landing)
  useEffect(() => {
    if (spinning) return
    wantLandRef.current = true
    if (canLandRef.current) landingRef.current = true
  }, [spinning])

  useEffect(() => () => { clearTimers(); cancelAnimationFrame(rafRef.current) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Spin for a random cocktail"
      style={{
        display: "block",
        width: expanded ? "100%" : SQUARE_W,
        transition: `width ${EXPAND_MS}ms cubic-bezier(0.4,0,0.2,1)`,
        background: "none", border: "none", padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      className="active:opacity-80"
    >
      <div style={{
        border: "2px solid var(--gold)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--surface-raised)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        {/* header */}
        <div style={{
          padding: "5px 0", textAlign: "center",
          background: "var(--gold)", color: "var(--on-gold)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
        }}>LUCKY POUR</div>

        {/* reel viewport */}
        <div ref={viewportRef} style={{ height: VH, overflow: "hidden", position: "relative" }}>
          {/* reel strip */}
          <div
            ref={reelRef}
            style={{
              display: "flex", flexDirection: "row",
              transform: `translateX(${INITIAL_POS}px)`,
              willChange: "transform",
            }}
          >
            {REEL_ITEMS.map((c, i) => (
              <div key={i} style={{
                flexShrink: 0, width: ITEM_W, height: VH,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ width: 80, height: 100 }}>{c.graphic}</div>
              </div>
            ))}
          </div>

          {/* left + right fades */}
          <div style={{ position:"absolute",inset:"0 auto 0 0",width:48,background:"linear-gradient(to right,var(--surface-raised),transparent)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",inset:"0 0 0 auto",width:48,background:"linear-gradient(to left,var(--surface-raised),transparent)",pointerEvents:"none" }}/>

          {/* ── Selector frame — always centred ── */}
          <div style={{
            position: "absolute",
            top: 6, bottom: 6,
            left: "50%",
            transform: `translateX(-${ITEM_W / 2}px)`,
            width: ITEM_W,
            border: "2px solid var(--gold)",
            borderRadius: 8,
            boxShadow: "0 0 16px rgba(212,175,55,0.35), inset 0 0 8px rgba(212,175,55,0.08)",
            pointerEvents: "none",
          }}/>
          {/* bracket corners for extra flair */}
          {[["0","0"],["0","auto"],["auto","0"],["auto","auto"]].map(([t,b], i) => (
            <div key={i} style={{
              position:"absolute",
              top: t === "0" ? 6 : "auto",
              bottom: b === "auto" && t !== "0" ? 6 : "auto",
              left: i < 2 ? `calc(50% - ${ITEM_W/2}px)` : "auto",
              right: i >= 2 ? `calc(50% - ${ITEM_W/2}px)` : "auto",
              width:10, height:10,
              borderTop: (i===0||i===2) ? "2.5px solid var(--gold)" : "none",
              borderBottom: (i===1||i===3) ? "2.5px solid var(--gold)" : "none",
              borderLeft: (i===0||i===1) ? "2.5px solid var(--gold)" : "none",
              borderRight: (i===2||i===3) ? "2.5px solid var(--gold)" : "none",
              pointerEvents:"none",
            }}/>
          ))}
        </div>

        {/* footer */}
        <div style={{
          padding: "6px 0 7px", textAlign: "center",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
          color: footerLabel === "rolling" ? "var(--gold)" : "var(--teal)",
          transition: "color 0.3s",
        }}>
          {footerLabel === "rolling" ? `Rolling${dots}` : "Feeling Lucky?"}
        </div>
      </div>
    </button>
  )
}
