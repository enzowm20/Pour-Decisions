import { useCallback, useEffect, useRef, useState } from "react"

interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

// ── SVG cocktail graphics — each one intentionally distinctive ────────────────
// ViewBox 0 0 80 100, stroke="var(--cream)", rounded caps/joins throughout

const MartiniSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid fill */}
    <polygon points="18,10 62,10 40,54" fill="#D4E84A" opacity=".8"/>
    {/* glass V */}
    <polyline points="10,8 40,56 70,8" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="10" y1="8" x2="70" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* stem */}
    <line x1="40" y1="56" x2="40" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* base */}
    <line x1="26" y1="80" x2="54" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* glass reflection */}
    <line x1="16" y1="12" x2="26" y2="38" stroke="var(--cream)" strokeWidth="1" opacity=".25" strokeLinecap="round"/>
    {/* olive pick — angled */}
    <line x1="30" y1="8" x2="50" y2="26" stroke="#C8A86A" strokeWidth="1.5" strokeLinecap="round"/>
    {/* olive */}
    <circle cx="50" cy="26" r="5.5" fill="#5A9A40" stroke="var(--cream)" strokeWidth="1.5"/>
    {/* pimento */}
    <ellipse cx="50" cy="26" rx="2" ry="3" fill="#D84040"/>
  </svg>
)

const OldFashionedSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* glass — short wide rocks */}
    <path d="M14 22 L17 80 Q17 83 20 83 L60 83 Q63 83 63 80 L66 22 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="14" y1="22" x2="66" y2="22" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid — amber */}
    <path d="M17 55 L17 80 Q17 83 20 83 L60 83 Q63 83 63 80 L63 55 Z" fill="#C96A18" opacity=".85"/>
    {/* ice cube */}
    <rect x="22" y="30" width="18" height="18" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.5"/>
    <line x1="28" y1="30" x2="28" y2="48" stroke="var(--cream)" strokeWidth=".8" opacity=".4"/>
    <line x1="22" y1="38" x2="40" y2="38" stroke="var(--cream)" strokeWidth=".8" opacity=".4"/>
    <rect x="42" y="36" width="14" height="14" rx="2" fill="rgba(180,220,255,.3)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* orange peel curl on rim */}
    <path d="M54 22 Q68 12 66 24 Q64 30 56 26" stroke="#E8901A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* cherry */}
    <circle cx="24" cy="56" r="4" fill="#C01820"/>
    <path d="M24 52 Q26 46 30 44" stroke="#4A8A30" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

const HighballSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* tall glass */}
    <path d="M18 10 L20 84 Q20 87 23 87 L57 87 Q60 87 60 84 L62 10 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="18" y1="10" x2="62" y2="10" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid — pale tonic */}
    <path d="M20 52 L20 84 Q20 87 23 87 L57 87 Q60 87 60 84 L60 52 Z" fill="#C8F0D8" opacity=".75"/>
    {/* ice cubes */}
    <rect x="24" y="18" width="14" height="14" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
    <rect x="42" y="24" width="12" height="12" rx="2" fill="rgba(180,220,255,.3)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* straw */}
    <line x1="52" y1="10" x2="48" y2="87" stroke="#E85A5A" strokeWidth="2.5" strokeLinecap="round"/>
    {/* lime wheel on rim */}
    <circle cx="26" cy="10" r="9" fill="#70B830" stroke="var(--cream)" strokeWidth="1.5"/>
    <circle cx="26" cy="10" r="5" fill="#A0D840" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="26" y1="1" x2="26" y2="19" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="17" y1="10" x2="35" y2="10" stroke="var(--cream)" strokeWidth=".8"/>
    {/* mint sprigs */}
    <line x1="34" y1="10" x2="32" y2="-2" stroke="#3A8020" strokeWidth="1.8" strokeLinecap="round"/>
    <ellipse cx="28" cy="2" rx="5" ry="3" fill="#50A030" transform="rotate(-25 28 2)"/>
    <ellipse cx="36" cy="-2" rx="5" ry="3" fill="#60B040" transform="rotate(15 36 -2)"/>
  </svg>
)

const CoupeSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid in bowl */}
    <path d="M18 12 Q18 48 40 52 Q62 48 62 12 Z" fill="#E84880" opacity=".8"/>
    {/* bowl */}
    <path d="M12 8 Q12 50 40 54 Q68 50 68 8 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* reflection */}
    <path d="M18 14 Q20 36 28 44" stroke="var(--cream)" strokeWidth="1" opacity=".2" fill="none" strokeLinecap="round"/>
    {/* stem */}
    <line x1="40" y1="54" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* base */}
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* cherry on decorative pick */}
    <line x1="32" y1="8" x2="42" y2="20" stroke="#C8A86A" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="42" cy="20" r="6" fill="#C01820" stroke="var(--cream)" strokeWidth="1.5"/>
    <path d="M42 14 Q46 8 50 10" stroke="#4A8A30" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* sugar rim dots */}
    {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
      const a = (i/12)*Math.PI
      const x = 40 - Math.cos(a)*28
      const y = 8
      return <circle key={i} cx={x} cy={y} r="1.2" fill="var(--cream)" opacity=".6"/>
    })}
  </svg>
)

const FluteSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* glass body — narrow tulip */}
    <path d="M28 10 Q24 30 26 60 L26 88 Q26 91 29 91 L51 91 Q54 91 54 88 L54 60 Q56 30 52 10 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="28" y1="10" x2="52" y2="10" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid */}
    <path d="M29 46 Q26 60 26 88 Q26 91 29 91 L51 91 Q54 91 54 88 L54 60 Q55 46 51 46 Z" fill="#F0C840" opacity=".85"/>
    {/* bubbles rising */}
    <circle cx="36" cy="78" r="2" fill="var(--cream)" opacity=".6"/>
    <circle cx="42" cy="68" r="1.5" fill="var(--cream)" opacity=".55"/>
    <circle cx="38" cy="58" r="1.2" fill="var(--cream)" opacity=".5"/>
    <circle cx="44" cy="82" r="1" fill="var(--cream)" opacity=".45"/>
    <circle cx="34" cy="88" r="1.5" fill="var(--cream)" opacity=".5"/>
    <circle cx="40" cy="50" r="1" fill="var(--cream)" opacity=".4"/>
    {/* stem */}
    <line x1="40" y1="91" x2="40" y2="96" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* base */}
    <line x1="30" y1="96" x2="50" y2="96" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* strawberry on rim */}
    <path d="M52 10 Q58 2 60 10 Q58 16 52 14 Z" fill="#E03040" stroke="var(--cream)" strokeWidth="1.2"/>
    <line x1="56" y1="2" x2="54" y2="-2" stroke="#3A8020" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const MargaritaSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid in wide V */}
    <polygon points="22,14 58,14 40,54" fill="#50D8A8" opacity=".82"/>
    {/* wide V glass */}
    <polyline points="6,10 40,58 74,10" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="6" y1="10" x2="74" y2="10" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* salt rim dashes */}
    {Array.from({length:18},(_,i)=>{
      const t = i/18, x = 6+t*68, y1 = 10, y2 = 6
      return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" opacity=".65"/>
    })}
    {/* stem */}
    <line x1="40" y1="58" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* base */}
    <line x1="28" y1="78" x2="52" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* lime wedge on rim */}
    <path d="M66 10 Q76 2 78 12 Q76 18 66 14 Z" fill="#78C030" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="72" y1="4" x2="72" y2="16" stroke="var(--cream)" strokeWidth=".8"/>
  </svg>
)

const WineGlassSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid in bowl */}
    <path d="M22 32 Q20 52 40 56 Q60 52 58 32 Z" fill="#A01840" opacity=".85"/>
    {/* bowl */}
    <path d="M16 8 Q14 54 40 58 Q66 54 64 8" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="16" y1="8" x2="64" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* bowl reflection */}
    <path d="M20 12 Q18 36 22 50" stroke="var(--cream)" strokeWidth="1" opacity=".22" fill="none" strokeLinecap="round"/>
    {/* waist narrowing to stem */}
    <path d="M40 58 Q38 63 36 68 L36 76 Q36 80 40 80 Q44 80 44 76 L44 68 Q42 63 40 58 Z" stroke="var(--cream)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    {/* base */}
    <line x1="26" y1="80" x2="54" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* swirl in wine */}
    <path d="M34 46 Q38 40 44 44 Q48 48 44 52" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

const ShotSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* thick-walled shot glass */}
    <path d="M22 30 L26 82 L54 82 L58 30 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="22" y1="30" x2="58" y2="30" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* thick walls suggestion */}
    <path d="M26 34 L27 78" stroke="var(--cream)" strokeWidth="1.5" opacity=".3" strokeLinecap="round"/>
    <path d="M54 34 L53 78" stroke="var(--cream)" strokeWidth="1.5" opacity=".3" strokeLinecap="round"/>
    {/* liquid — tequila amber */}
    <path d="M26 58 L26 82 L54 82 L54 58 Z" fill="#D08020" opacity=".9"/>
    {/* lime wedge balanced on rim */}
    <path d="M52 30 Q62 20 66 30 Q64 36 54 34 Z" fill="#70B020" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="59" y1="22" x2="59" y2="34" stroke="var(--cream)" strokeWidth=".8"/>
    {/* salt on rim */}
    {[0,1,2,3,4].map(i=><circle key={i} cx={22+i*9} cy={30} r="1.5" fill="var(--cream)" opacity=".5"/>)}
  </svg>
)

const MojitoSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* tall slightly curved glass */}
    <path d="M17 10 L19 86 Q19 89 22 89 L58 89 Q61 89 61 86 L63 10 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="17" y1="10" x2="63" y2="10" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* muddled mint / lime at bottom */}
    <ellipse cx="40" cy="82" rx="16" ry="4" fill="#3A7820" opacity=".8"/>
    {/* liquid — light minty green */}
    <path d="M19 46 L19 86 Q19 89 22 89 L58 89 Q61 89 61 86 L61 46 Z" fill="#B8E8A0" opacity=".7"/>
    {/* lime half inside */}
    <path d="M26 50 Q26 60 36 60 Q36 50 26 50 Z" fill="#70B820" opacity=".9" stroke="var(--cream)" strokeWidth="1"/>
    <line x1="26" y1="55" x2="36" y2="55" stroke="var(--cream)" strokeWidth=".8" opacity=".6"/>
    {/* straw */}
    <line x1="54" y1="10" x2="50" y2="89" stroke="#E8E0A0" strokeWidth="3" strokeLinecap="round"/>
    {/* mint sprigs above rim */}
    <line x1="36" y1="10" x2="34" y2="-4" stroke="#2A7010" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="30" cy="0" rx="6" ry="3.5" fill="#40900A" transform="rotate(-20 30 0)"/>
    <ellipse cx="38" cy="-5" rx="6" ry="3.5" fill="#50A818" transform="rotate(10 38 -5)"/>
    <ellipse cx="44" cy="-1" rx="5" ry="3" fill="#40900A" transform="rotate(-35 44 -1)"/>
  </svg>
)

const EspressoMartiniSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid — dark espresso */}
    <polygon points="18,10 62,10 40,54" fill="#1A0A04" opacity=".97"/>
    {/* foam layer on top */}
    <path d="M18 10 Q40 16 62 10" fill="#7A4820" opacity=".7" stroke="none"/>
    {/* glass V */}
    <polyline points="10,8 40,56 70,8" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="10" y1="8" x2="70" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* stem + base */}
    <line x1="40" y1="56" x2="40" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="80" x2="54" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* 3 coffee beans on foam */}
    <ellipse cx="36" cy="12" rx="3.5" ry="2" fill="#3A1808" stroke="#6A3010" strokeWidth="1" transform="rotate(-20 36 12)"/>
    <line x1="34" y1="12" x2="38" y2="12" stroke="#1A0804" strokeWidth=".8"/>
    <ellipse cx="44" cy="12" rx="3.5" ry="2" fill="#3A1808" stroke="#6A3010" strokeWidth="1" transform="rotate(20 44 12)"/>
    <line x1="42" y1="12" x2="46" y2="12" stroke="#1A0804" strokeWidth=".8"/>
    <ellipse cx="40" cy="16" rx="3.5" ry="2" fill="#3A1808" stroke="#6A3010" strokeWidth="1"/>
    <line x1="38" y1="16" x2="42" y2="16" stroke="#1A0804" strokeWidth=".8"/>
  </svg>
)

const NegroniSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* rocks glass */}
    <path d="M13 22 L16 82 Q16 85 19 85 L61 85 Q64 85 64 82 L67 22 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="13" y1="22" x2="67" y2="22" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid — campari red */}
    <path d="M16 50 L16 82 Q16 85 19 85 L61 85 Q64 85 64 82 L64 50 Z" fill="#C02018" opacity=".88"/>
    {/* large ice sphere */}
    <circle cx="40" cy="36" r="14" fill="rgba(180,220,255,.3)" stroke="var(--cream)" strokeWidth="1.5"/>
    <circle cx="36" cy="32" r="4" fill="rgba(255,255,255,.2)"/>
    {/* orange half-wheel on rim */}
    <path d="M52 22 Q68 14 70 26 Q68 36 52 32 Z" fill="#E87820" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="61" y1="15" x2="61" y2="34" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="52" y1="27" x2="70" y2="27" stroke="var(--cream)" strokeWidth=".8"/>
    {/* orange segments */}
    <line x1="56" y1="16" x2="61" y2="34" stroke="var(--cream)" strokeWidth=".6" opacity=".5"/>
    <line x1="67" y1="18" x2="61" y2="34" stroke="var(--cream)" strokeWidth=".6" opacity=".5"/>
  </svg>
)

const DaiquiriSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <path d="M16 12 Q16 46 40 50 Q64 46 64 12 Z" fill="#E8F8C0" opacity=".82"/>
    {/* coupe bowl */}
    <path d="M12 8 Q12 50 40 54 Q68 50 68 8 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* reflection */}
    <path d="M18 14 Q16 36 22 46" stroke="var(--cream)" strokeWidth="1" opacity=".2" fill="none" strokeLinecap="round"/>
    {/* stem + base */}
    <line x1="40" y1="54" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* lime wheel on rim */}
    <circle cx="60" cy="8" r="10" fill="#70B820" stroke="var(--cream)" strokeWidth="1.5"/>
    <circle cx="60" cy="8" r="6" fill="#90D030" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="60" y1="-2" x2="60" y2="18" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="50" y1="8" x2="70" y2="8" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="53" y1="1" x2="67" y2="15" stroke="var(--cream)" strokeWidth=".6" opacity=".6"/>
    <line x1="67" y1="1" x2="53" y2="15" stroke="var(--cream)" strokeWidth=".6" opacity=".6"/>
  </svg>
)

const SpritsSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* wine glass with ice — spritz style */}
    <path d="M20 34 Q18 56 40 60 Q62 56 60 34 Z" fill="#F07020" opacity=".83"/>
    <path d="M16 8 Q14 56 40 60 Q66 56 64 8" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="16" y1="8" x2="64" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M40 60 Q36 64 36 72 Q36 78 40 80 Q44 78 44 72 Q44 64 40 60 Z" stroke="var(--cream)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <line x1="26" y1="80" x2="54" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* ice cubes */}
    <rect x="24" y="18" width="11" height="11" rx="2" fill="rgba(180,220,255,.4)" stroke="var(--cream)" strokeWidth="1.2"/>
    <rect x="38" y="14" width="11" height="11" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* bubbles */}
    <circle cx="44" cy="42" r="1.5" fill="var(--cream)" opacity=".6"/>
    <circle cx="38" cy="50" r="1.2" fill="var(--cream)" opacity=".5"/>
    <circle cx="50" cy="48" r="1" fill="var(--cream)" opacity=".5"/>
    {/* orange slice on rim */}
    <path d="M56 8 Q68 0 72 10 Q70 18 56 14 Z" fill="#F09030" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="64" y1="0" x2="64" y2="16" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="56" y1="9" x2="72" y2="9" stroke="var(--cream)" strokeWidth=".8"/>
  </svg>
)

const GimletSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* coupe — pale green gimlet */}
    <path d="M16 12 Q16 46 40 50 Q64 46 64 12 Z" fill="#90E078" opacity=".8"/>
    <path d="M12 8 Q12 50 40 54 Q68 50 68 8 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="40" y1="54" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* lime wheel submerged */}
    <circle cx="40" cy="34" r="10" fill="#58A818" opacity=".75" stroke="var(--cream)" strokeWidth="1.2"/>
    <circle cx="40" cy="34" r="6" fill="#78C830" opacity=".8" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="40" y1="24" x2="40" y2="44" stroke="var(--cream)" strokeWidth=".8" opacity=".7"/>
    <line x1="30" y1="34" x2="50" y2="34" stroke="var(--cream)" strokeWidth=".8" opacity=".7"/>
    <line x1="33" y1="27" x2="47" y2="41" stroke="var(--cream)" strokeWidth=".6" opacity=".5"/>
    <line x1="47" y1="27" x2="33" y2="41" stroke="var(--cream)" strokeWidth=".6" opacity=".5"/>
  </svg>
)

const PalomaSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* highball — paloma pink */}
    <path d="M17 12 L19 86 Q19 89 22 89 L58 89 Q61 89 61 86 L63 12 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="17" y1="12" x2="63" y2="12" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid */}
    <path d="M19 50 L19 86 Q19 89 22 89 L58 89 Q61 89 61 86 L61 50 Z" fill="#F09890" opacity=".82"/>
    {/* salt rim dashes */}
    {Array.from({length:14},(_,i)=>{
      const x = 17+i*3.3
      return <line key={i} x1={x} y1={12} x2={x} y2={8} stroke="var(--cream)" strokeWidth="1.8" strokeLinecap="round" opacity=".6"/>
    })}
    {/* grapefruit half-wheel on rim */}
    <path d="M50 12 Q66 4 70 14 Q68 22 50 18 Z" fill="#F87060" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="60" y1="4" x2="60" y2="20" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="50" y1="13" x2="70" y2="13" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="53" y1="6" x2="66" y2="19" stroke="var(--cream)" strokeWidth=".6" opacity=".5"/>
    <line x1="66" y1="6" x2="53" y2="19" stroke="var(--cream)" strokeWidth=".6" opacity=".5"/>
    {/* ice */}
    <rect x="22" y="22" width="14" height="14" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
  </svg>
)

const MuleSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* copper mug body */}
    <path d="M14 20 L16 82 Q16 86 20 86 L60 86 Q64 86 64 82 L66 20 Z" fill="#B86020" opacity=".4" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round"/>
    <line x1="14" y1="20" x2="66" y2="20" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* copper sheen bands */}
    <line x1="16" y1="36" x2="64" y2="36" stroke="#D08030" strokeWidth="1" opacity=".5"/>
    <line x1="16" y1="52" x2="64" y2="52" stroke="#D08030" strokeWidth="1" opacity=".5"/>
    {/* liquid — ginger beer golden */}
    <path d="M16 52 L16 82 Q16 86 20 86 L60 86 Q64 86 64 82 L64 52 Z" fill="#E0A040" opacity=".8"/>
    {/* handle — distinctive! */}
    <path d="M64 28 Q82 28 82 48 Q82 68 64 68" stroke="var(--cream)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* ice */}
    <rect x="22" y="28" width="14" height="14" rx="2" fill="rgba(180,220,255,.4)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* lime wedge */}
    <path d="M44 20 Q54 10 58 20 Q56 26 44 24 Z" fill="#70B020" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    {/* mint */}
    <line x1="34" y1="20" x2="32" y2="8" stroke="#2A7010" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="28" cy="10" rx="5" ry="3" fill="#40900A" transform="rotate(-25 28 10)"/>
    <ellipse cx="36" cy="6" rx="5" ry="3" fill="#50A818" transform="rotate(15 36 6)"/>
  </svg>
)

const TomCollinsSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* tall Collins glass */}
    <path d="M18 10 L20 86 Q20 89 23 89 L57 89 Q60 89 60 86 L62 10 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="18" y1="10" x2="62" y2="10" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid — lemon yellow */}
    <path d="M20 50 L20 86 Q20 89 23 89 L57 89 Q60 89 60 86 L60 50 Z" fill="#F0E060" opacity=".8"/>
    {/* ice */}
    <rect x="24" y="18" width="14" height="14" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
    <rect x="42" y="24" width="12" height="12" rx="2" fill="rgba(180,220,255,.3)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* straw — blue */}
    <line x1="50" y1="10" x2="46" y2="89" stroke="#4080E0" strokeWidth="3" strokeLinecap="round" opacity=".9"/>
    {/* cherry and lemon stacked on rim */}
    <circle cx="28" cy="10" r="7" fill="#E89020" stroke="var(--cream)" strokeWidth="1.5"/>
    <line x1="28" y1="3" x2="28" y2="17" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="21" y1="10" x2="35" y2="10" stroke="var(--cream)" strokeWidth=".8"/>
    <circle cx="28" cy="4" r="4.5" fill="#D02828" stroke="var(--cream)" strokeWidth="1.5"/>
    <path d="M28 0 Q30 -4 34 -2" stroke="#3A8020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

const BrambleSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* rocks glass */}
    <path d="M13 22 L16 82 Q16 85 19 85 L61 85 Q64 85 64 82 L67 22 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="13" y1="22" x2="67" y2="22" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* gin base liquid */}
    <path d="M16 48 L16 82 Q16 85 19 85 L61 85 Q64 85 64 82 L64 48 Z" fill="#C8C0F0" opacity=".7"/>
    {/* blackberry coulis drizzle */}
    <path d="M30 48 Q36 42 44 50 Q50 54 44 60 Q38 64 34 58 Q28 52 34 46" stroke="#5010A0" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* ice */}
    <rect x="22" y="30" width="14" height="14" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* blackberries on top */}
    <circle cx="48" cy="26" r="5" fill="#400870" stroke="var(--cream)" strokeWidth="1.2"/>
    <circle cx="57" cy="24" r="4.5" fill="#5010A0" stroke="var(--cream)" strokeWidth="1.2"/>
    <circle cx="52" cy="20" r="4" fill="#3A0860" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* drupelets on berries */}
    {[[48,26],[57,24],[52,20]].map(([cx,cy],i)=>
      [[0,-3],[3,0],[0,3],[-3,0]].map(([dx,dy],j)=>
        <circle key={`${i}-${j}`} cx={cx+dx} cy={cy+dy} r="1.2" fill="rgba(255,255,255,.25)"/>
      )
    )}
    {/* lemon slice */}
    <path d="M20 22 Q10 14 8 24 Q10 32 20 28 Z" fill="#E8D020" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="14" y1="14" x2="14" y2="30" stroke="var(--cream)" strokeWidth=".8"/>
  </svg>
)

const PinaColadaSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* hurricane glass shape — curves in at middle, out at bottom */}
    <path d="M22 8 Q14 36 18 54 Q22 70 24 88 L56 88 Q58 70 62 54 Q66 36 58 8 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="22" y1="8" x2="58" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* liquid — creamy coconut */}
    <path d="M20 50 Q22 70 24 88 L56 88 Q58 70 60 50 Z" fill="#FFF8D8" opacity=".88"/>
    {/* straw */}
    <line x1="52" y1="8" x2="56" y2="88" stroke="#E85A5A" strokeWidth="2.5" strokeLinecap="round"/>
    {/* pineapple wedge */}
    <path d="M58 8 Q70 2 72 12 Q70 20 58 16 Z" fill="#E0C020" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M64 2 Q62 -4 66 -4 Q70 -4 68 2" stroke="#3A8020" strokeWidth="2" fill="#3A8020" strokeLinejoin="round"/>
    <path d="M60 2 Q58 -4 62 -4" stroke="#50A030" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* cherry */}
    <circle cx="58" cy="14" r="4.5" fill="#D02020" stroke="var(--cream)" strokeWidth="1.5"/>
    <path d="M58 10 Q62 4 66 6" stroke="#3A8020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* cocktail umbrella */}
    <line x1="30" y1="8" x2="36" y2="40" stroke="#B0A080" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 8 Q28 20 20 22 Q28 18 36 22 Q44 18 44 16 Q40 20 36 18 Q38 14 34 12 Z" fill="#F04080" stroke="var(--cream)" strokeWidth="1" strokeLinejoin="round"/>
  </svg>
)

const BlueLagoonSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* highball */}
    <path d="M18 10 L20 86 Q20 89 23 89 L57 89 Q60 89 60 86 L62 10 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="18" y1="10" x2="62" y2="10" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* electric blue liquid */}
    <path d="M20 44 L20 86 Q20 89 23 89 L57 89 Q60 89 60 86 L60 44 Z" fill="#0870E8" opacity=".88"/>
    {/* clear top layer */}
    <path d="M20 28 L20 44 L60 44 L60 28 Z" fill="#90C8F8" opacity=".5"/>
    {/* ice */}
    <rect x="24" y="18" width="14" height="14" rx="2" fill="rgba(180,220,255,.4)" stroke="var(--cream)" strokeWidth="1.2"/>
    <rect x="42" y="14" width="12" height="12" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* straw — yellow */}
    <line x1="52" y1="10" x2="48" y2="89" stroke="#F0D030" strokeWidth="3" strokeLinecap="round"/>
    {/* lemon on rim */}
    <circle cx="26" cy="10" r="9" fill="#F0D030" stroke="var(--cream)" strokeWidth="1.5"/>
    <circle cx="26" cy="10" r="5" fill="#F8E860" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="26" y1="1" x2="26" y2="19" stroke="var(--cream)" strokeWidth=".8"/>
    <line x1="17" y1="10" x2="35" y2="10" stroke="var(--cream)" strokeWidth=".8"/>
  </svg>
)

const AviationSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* violet coupe */}
    <path d="M16 12 Q16 46 40 50 Q64 46 64 12 Z" fill="#6848C8" opacity=".82"/>
    <path d="M12 8 Q12 50 40 54 Q68 50 68 8 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 14 Q16 36 22 46" stroke="var(--cream)" strokeWidth="1" opacity=".2" fill="none" strokeLinecap="round"/>
    <line x1="40" y1="54" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* maraschino cherry */}
    <circle cx="50" cy="16" r="5.5" fill="#C01820" stroke="var(--cream)" strokeWidth="1.5"/>
    <path d="M50 11 Q54 5 58 7" stroke="#3A8020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* lemon twist */}
    <path d="M24 10 Q18 4 20 12 Q22 18 28 16" stroke="#E8D030" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* violet flower garnish */}
    <circle cx="40" cy="20" r="3" fill="#8060D0"/>
    {[0,72,144,216,288].map(a=>{
      const rad = a*Math.PI/180
      return <ellipse key={a} cx={40+Math.cos(rad)*6} cy={20+Math.sin(rad)*6} rx="3" ry="1.8" fill="#A080E8" transform={`rotate(${a} ${40+Math.cos(rad)*6} ${20+Math.sin(rad)*6})`}/>
    })}
  </svg>
)

const SidecarSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* amber coupe */}
    <path d="M16 12 Q16 46 40 50 Q64 46 64 12 Z" fill="#D89030" opacity=".85"/>
    <path d="M12 8 Q12 50 40 54 Q68 50 68 8 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* sugar rim */}
    {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i=>{
      const t = i/14, x = 12+t*56
      return <circle key={i} cx={x} cy={8} r="1.5" fill="var(--cream)" opacity=".55"/>
    })}
    <line x1="40" y1="54" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* orange peel twist */}
    <path d="M60 10 Q70 2 72 12 Q70 20 62 18 Q56 14 60 8" stroke="#E89030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* reflection */}
    <path d="M18 14 Q16 36 22 46" stroke="var(--cream)" strokeWidth="1" opacity=".2" fill="none" strokeLinecap="round"/>
  </svg>
)

const RumPunchSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* tiki-style wide curved glass */}
    <path d="M16 14 Q10 44 14 72 Q16 82 40 86 Q64 82 66 72 Q70 44 64 14 Z" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="16" y1="14" x2="64" y2="14" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* tropical punch liquid */}
    <path d="M14 50 Q14 72 16 82 Q20 86 40 86 Q60 86 64 82 Q66 72 66 50 Z" fill="#F05028" opacity=".85"/>
    {/* straw */}
    <line x1="54" y1="14" x2="58" y2="86" stroke="#48C040" strokeWidth="3" strokeLinecap="round"/>
    {/* cocktail umbrella */}
    <line x1="28" y1="14" x2="32" y2="44" stroke="#B0A080" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M28 14 Q26 24 18 26 Q26 22 34 26 Q40 22 38 18 Q34 22 30 20 Q32 16 28 14 Z" fill="#30A0D0" stroke="var(--cream)" strokeWidth="1" strokeLinejoin="round"/>
    {/* pineapple + cherry */}
    <path d="M58 14 Q68 8 70 18 Q68 24 58 20 Z" fill="#E0C020" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M64 8 Q62 2 66 2 Q70 2 68 8" stroke="#3A8020" strokeWidth="2" fill="#3A8020" strokeLinejoin="round"/>
    <circle cx="58" cy="17" r="4" fill="#D02020" stroke="var(--cream)" strokeWidth="1.2"/>
    {/* ice */}
    <rect x="20" y="28" width="12" height="12" rx="2" fill="rgba(180,220,255,.35)" stroke="var(--cream)" strokeWidth="1.2"/>
  </svg>
)

const PornstarSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* gold martini */}
    <polygon points="18,10 62,10 40,54" fill="#F8A820" opacity=".9"/>
    <polyline points="10,8 40,56 70,8" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="10" y1="8" x2="70" y2="8" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="40" y1="56" x2="40" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="80" x2="54" y2="80" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"/>
    {/* passion fruit half on the rim — distinctive! */}
    <circle cx="62" cy="10" r="9" fill="#E87820" stroke="var(--cream)" strokeWidth="1.5"/>
    <circle cx="62" cy="10" r="6" fill="#F8A830" stroke="var(--cream)" strokeWidth=".8"/>
    {/* passion fruit seeds */}
    {[[60,8],[64,8],[62,11],[58,11],[66,11]].map(([x,y],i)=>
      <ellipse key={i} cx={x} cy={y} rx="1.5" ry="1" fill="#3A1808" transform={`rotate(${i*36} ${x} ${y})`}/>
    )}
    {/* prosecco shot on the side — very distinctive */}
    <path d="M4 70 L6 90 L16 90 L18 70 Z" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <line x1="4" y1="70" x2="18" y2="70" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 80 L6 90 L16 90 L16 80 Z" fill="#F0D050" opacity=".8"/>
    <circle cx="10" cy="76" r="1" fill="var(--cream)" opacity=".6"/>
    <circle cx="13" cy="72" r=".8" fill="var(--cream)" opacity=".5"/>
  </svg>
)

// ── Reel config ───────────────────────────────────────────────────────────────

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

const N        = COCKTAILS.length   // 24
const ITEM_W   = 152
const SET_W    = N * ITEM_W         // 3 648 px
const VH       = 148
const SQUARE_W = ITEM_W + 16       // 168 px

// 12 copies, start at copy 5 so item 0 is centred in square viewport
// A_square = (SQUARE_W - ITEM_W) / 2 = 8
// INITIAL_POS = A_square − copy5_item0_idx × ITEM_W = 8 − 120×152 = −18 232
const COPY_START  = 5
const INITIAL_POS = (SQUARE_W - ITEM_W) / 2 - COPY_START * SET_W

const REEL_ITEMS = Array.from({ length: 12 }, () => COCKTAILS).flat()
const EXPAND_MS  = 480

type Phase = "square" | "retracting" | "expanding" | "spinning" | "landed"

export default function SlotMachineButton({ onClick, disabled, spinning }: Props) {
  const reelRef     = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const posRef      = useRef(INITIAL_POS)
  const speedRef    = useRef(0)
  const landingRef  = useRef(false)
  const canLandRef  = useRef(false)
  const wantLandRef = useRef(false)
  const rafRef      = useRef(0)
  const phaseRef    = useRef<Phase>("square")
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([])

  const [expanded,    setExpanded]    = useState(false)
  const [selected,    setSelected]    = useState(false)   // true = idle blue theme
  const [showFrame,   setShowFrame]   = useState(false)
  const [footerLabel, setFooterLabel] = useState<"lucky" | "rolling" | "done">("lucky")
  const [dots,        setDots]        = useState(".")

  useEffect(() => {
    if (footerLabel !== "rolling") { setDots("."); return }
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400)
    return () => clearInterval(id)
  }, [footerLabel])

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms); timersRef.current.push(id); return id
  }
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  const getAnchor = () => {
    const vW = viewportRef.current?.offsetWidth ?? SQUARE_W
    return (vW - ITEM_W) / 2
  }

  // Normalise reel so pos always sits in the middle of the strip
  const normalisePos = (anchor: number) => {
    const reel = reelRef.current
    if (!reel) return
    const N_current  = Math.round((anchor - posRef.current) / ITEM_W)
    const N_visual   = ((N_current % N) + N) % N
    const N_norm     = COPY_START * N + N_visual
    const normPos    = anchor - N_norm * ITEM_W
    posRef.current   = normPos
    reel.style.transform = `translateX(${normPos}px)`
  }

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    landingRef.current  = false
    canLandRef.current  = false
    wantLandRef.current = false
    speedRef.current    = 0
    setFooterLabel("rolling")
    setSelected(false)
    phaseRef.current = "spinning"

    // Normalise BEFORE the spin — prevents strip overflow on repeated presses
    normalisePos(getAnchor())

    timersRef.current.push(setTimeout(() => {
      canLandRef.current = true
      if (wantLandRef.current) landingRef.current = true
    }, 700))

    const MAX_SPEED  = 1.6
    const ACCEL      = 0.07
    const FRICTION   = 0.958
    const SNAP_SPEED = 0.12  // hand off to CSS snap animation below this

    const loop = (t: number, lastT: number) => {
      const dt   = Math.min(t - lastT, 50)
      const reel = reelRef.current
      if (!reel) return

      if (landingRef.current) {
        speedRef.current *= Math.pow(FRICTION, dt / 16.67)

        if (speedRef.current > SNAP_SPEED) {
          posRef.current -= speedRef.current * dt
          reel.style.transform = `translateX(${posRef.current}px)`
          rafRef.current = requestAnimationFrame(t2 => loop(t2, t))
        } else {
          // Smooth final snap via CSS animation — lands exactly in frame
          const A      = getAnchor()
          const N_snap = Math.round((A - posRef.current) / ITEM_W)
          const snapTo = A - N_snap * ITEM_W
          const dist   = Math.abs(snapTo - posRef.current)
          const dur    = Math.max(200, Math.min(600, dist / speedRef.current))

          reel.style.transition = `transform ${dur}ms cubic-bezier(0.25,0.46,0.45,0.94)`
          reel.style.transform  = `translateX(${snapTo}px)`
          posRef.current = snapTo

          const cleanup = () => {
            reel.style.transition = ""
            phaseRef.current = "landed"
            setFooterLabel("done")
            setSelected(true)
          }
          timersRef.current.push(setTimeout(cleanup, dur + 20))
        }
      } else {
        speedRef.current = Math.min(speedRef.current + ACCEL * (dt / 16.67), MAX_SPEED)
        posRef.current  -= speedRef.current * dt
        reel.style.transform = `translateX(${posRef.current}px)`
        if (canLandRef.current && wantLandRef.current) landingRef.current = true
        rafRef.current = requestAnimationFrame(t2 => loop(t2, t))
      }
    }
    rafRef.current = requestAnimationFrame(t => loop(t, t))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const doExpand = useCallback(() => {
    phaseRef.current = "expanding"
    setExpanded(true)
    addTimer(() => {
      setShowFrame(true)
      startLoop()
    }, EXPAND_MS + 40)
  }, [startLoop]) // eslint-disable-line react-hooks/exhaustive-deps

  const doRetract = useCallback(() => {
    phaseRef.current = "retracting"
    cancelAnimationFrame(rafRef.current)
    setShowFrame(false)
    // Snap to square-centred item before retracting
    const A_sq    = (SQUARE_W - ITEM_W) / 2
    const N_snap  = Math.round((A_sq - posRef.current) / ITEM_W)
    const snapPos = A_sq - N_snap * ITEM_W
    posRef.current = snapPos
    if (reelRef.current) {
      reelRef.current.style.transition = ""
      reelRef.current.style.transform  = `translateX(${snapPos}px)`
    }
    setExpanded(false)
    addTimer(() => doExpand(), EXPAND_MS + 40)
  }, [doExpand]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!spinning) return
    clearTimers()
    const phase = phaseRef.current
    if (phase === "square")  doExpand()
    if (phase === "landed")  doRetract()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning])

  useEffect(() => {
    if (spinning) return
    wantLandRef.current = true
    if (canLandRef.current) landingRef.current = true
  }, [spinning])

  useEffect(() => () => { clearTimers(); cancelAnimationFrame(rafRef.current) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Theming: gold while idle/rolling, teal-blue after landing ────────────────
  const borderColor  = selected ? "var(--teal)"                  : "var(--gold)"
  const headerBg     = selected ? "var(--teal)"                  : "var(--gold)"
  const headerColor  = selected ? "var(--bg)"                    : "var(--on-gold)"
  const footerColor  = footerLabel === "rolling" ? "var(--gold)" : selected ? "var(--teal)" : "var(--teal)"

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
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--surface-raised)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: `border-color 0.6s ease, box-shadow 0.6s ease`,
      }}>
        {/* header */}
        <div style={{
          padding: "5px 0", textAlign: "center",
          background: headerBg, color: headerColor,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          transition: "background 0.6s ease, color 0.6s ease",
        }}>LUCKY POUR</div>

        {/* reel viewport */}
        <div ref={viewportRef} style={{ height: VH, overflow: "hidden", position: "relative" }}>
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

          {/* fades */}
          <div style={{ position:"absolute",inset:"0 auto 0 0",width:52,background:"linear-gradient(to right,var(--surface-raised),transparent)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",inset:"0 0 0 auto",width:52,background:"linear-gradient(to left,var(--surface-raised),transparent)",pointerEvents:"none" }}/>

          {/* Selector frame — only visible when expanded */}
          <div style={{
            position: "absolute",
            top: 6, bottom: 6,
            left: "50%",
            transform: `translateX(-${ITEM_W / 2}px)`,
            width: ITEM_W,
            border: `2px solid ${selected ? "var(--teal)" : "var(--gold)"}`,
            borderRadius: 10,
            boxShadow: selected
              ? "0 0 18px rgba(100,200,200,0.3), inset 0 0 8px rgba(100,200,200,0.06)"
              : "0 0 18px rgba(212,175,55,0.3), inset 0 0 8px rgba(212,175,55,0.06)",
            pointerEvents: "none",
            opacity: showFrame ? 1 : 0,
            transition: "opacity 0.3s ease, border-color 0.6s ease, box-shadow 0.6s ease",
          }}/>
        </div>

        {/* footer */}
        <div style={{
          padding: "6px 0 7px", textAlign: "center",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
          color: footerColor, transition: "color 0.6s",
        }}>
          {footerLabel === "rolling" ? `Rolling${dots}` : "Feeling Lucky?"}
        </div>
      </div>
    </button>
  )
}
