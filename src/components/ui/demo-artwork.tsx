type ArtworkKind = "CERAMIC" | "MAGAZINE" | "POSTCARD" | "COLLECTION";

const palettes: Record<ArtworkKind, { bg: string; ink: string; accent: string; soft: string }> = {
  CERAMIC: { bg: "#d8c9b5", ink: "#25453c", accent: "#a65f3e", soft: "#f2e8d9" },
  MAGAZINE: { bg: "#c9c2af", ink: "#202f2b", accent: "#bd5137", soft: "#ede8dc" },
  POSTCARD: { bg: "#d8d1bd", ink: "#294e49", accent: "#a96749", soft: "#f4ecdd" },
  COLLECTION: { bg: "#cfc6b2", ink: "#173f35", accent: "#8d553c", soft: "#eee6d9" },
};

export function DemoArtwork({ kind, title, className = "", priorityLabel }: { kind: ArtworkKind; title: string; className?: string; priorityLabel?: string }) {
  const p = palettes[kind];
  return (
    <div className={`relative isolate overflow-hidden bg-stone-200 ${className}`} role="img" aria-label={`Visuel de démonstration pour ${title}`} style={{ background: p.bg }}>
      <svg viewBox="0 0 600 720" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id={`grain-${kind}`}><feTurbulence baseFrequency=".75" numOctaves="2" stitchTiles="stitch" type="fractalNoise" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .07"/></feComponentTransfer></filter>
          <linearGradient id={`shade-${kind}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={p.soft}/><stop offset="1" stopColor={p.bg}/></linearGradient>
        </defs>
        <rect width="600" height="720" fill={`url(#shade-${kind})`} />
        {kind === "CERAMIC" && <Ceramic p={p} />}
        {kind === "MAGAZINE" && <Magazine p={p} title={title} />}
        {kind === "POSTCARD" && <Postcard p={p} />}
        {kind === "COLLECTION" && <Collection p={p} />}
        <rect width="600" height="720" filter={`url(#grain-${kind})`} opacity=".65" />
      </svg>
      <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.16em] text-stone-600 backdrop-blur">{priorityLabel ?? "Visuel de démonstration"}</span>
    </div>
  );
}

type Palette = { bg: string; ink: string; accent: string; soft: string };
function Ceramic({ p }: { p: Palette }) {
  return <g><ellipse cx="300" cy="612" rx="175" ry="30" fill="#3d3831" opacity=".15"/><path d="M205 226c8 80-18 123-49 171-31 50-16 160 20 194 55 51 194 51 249 0 36-34 51-144 20-194-31-48-58-91-49-171z" fill={p.ink}/><path d="M205 226c31 24 160 24 191 0 5-26-10-51-33-61-29-13-97-13-126 0-23 10-38 35-32 61z" fill={p.accent}/><ellipse cx="300" cy="226" rx="96" ry="29" fill={p.soft}/><path d="M180 440c67-46 163-58 252-17" fill="none" stroke={p.accent} strokeWidth="26" opacity=".82"/><path d="M188 491c76-42 163-45 237-9" fill="none" stroke={p.soft} strokeWidth="9" opacity=".8"/></g>;
}
function Magazine({ p, title }: { p: Palette; title: string }) {
  return <g transform="rotate(-3 300 360)"><rect x="115" y="70" width="370" height="585" rx="4" fill={p.soft} stroke={p.ink} strokeWidth="3"/><rect x="130" y="86" width="340" height="82" fill={p.ink}/><text x="300" y="139" fill={p.soft} fontSize="34" fontFamily="Georgia" textAnchor="middle" letterSpacing="5">L’ARCHIVE</text><text x="300" y="190" fill={p.ink} fontSize="13" fontFamily="Arial" textAnchor="middle" letterSpacing="3">AUTO · MOTO · ROUTE</text><circle cx="300" cy="383" r="139" fill={p.bg}/><path d="M164 437c49-54 88-80 150-90l92 20 42 55-24 19-39-12c-9 31-53 31-65-3l-93 3c-13 32-57 28-64-4z" fill={p.accent}/><circle cx="218" cy="430" r="29" fill={p.ink}/><circle cx="359" cy="430" r="29" fill={p.ink}/><path d="M221 346l61-52 78 10 41 52" fill="none" stroke={p.ink} strokeWidth="11"/><line x1="144" y1="561" x2="455" y2="561" stroke={p.ink} strokeWidth="2"/><text x="300" y="595" fill={p.ink} fontSize="17" fontFamily="Georgia" textAnchor="middle">{title.slice(0, 30).toUpperCase()}</text></g>;
}
function Postcard({ p }: { p: Palette }) {
  return <g transform="rotate(2 300 360)"><rect x="60" y="104" width="480" height="510" rx="4" fill={p.soft} stroke={p.ink} strokeWidth="4"/><rect x="82" y="128" width="436" height="354" fill={p.bg}/><circle cx="402" cy="225" r="68" fill={p.accent} opacity=".82"/><path d="M82 403l103-112 61 63 79-116 94 128 99-61v177H82z" fill={p.ink} opacity=".86"/><path d="M82 433c119-60 278-63 436-14" fill="none" stroke={p.soft} strokeWidth="19"/><path d="M99 515h195M99 545h155M99 575h214" stroke={p.ink} strokeWidth="3" opacity=".45"/><rect x="421" y="515" width="69" height="70" fill="none" stroke={p.accent} strokeWidth="4"/><text x="455" y="553" fill={p.accent} fontSize="19" fontFamily="Georgia" textAnchor="middle">CPA</text></g>;
}
function Collection({ p }: { p: Palette }) {
  return <g><circle cx="193" cy="275" r="112" fill={p.ink}/><circle cx="396" cy="246" r="89" fill={p.accent}/><rect x="119" y="350" width="369" height="218" rx="8" fill={p.soft} stroke={p.ink} strokeWidth="3"/><path d="M153 515l92-98 57 54 66-84 89 128z" fill={p.bg}/><path d="M105 596h390" stroke={p.ink} strokeWidth="5"/><circle cx="300" cy="274" r="74" fill={p.soft} opacity=".82"/></g>;
}
