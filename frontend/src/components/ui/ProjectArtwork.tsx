/**
 * Grafismo gerado a partir do slug para projectos sem capa: grelha, nós e ligações
 * (alusão a sistemas e arquitectura). Determinístico — o mesmo projecto tem sempre o mesmo desenho.
 */
const palettes = [
  { bg: '#241521', a: '#FF5A36', b: '#F4D96B', line: '#B7A0D9' },
  { bg: '#392438', a: '#B7A0D9', b: '#FF5A36', line: '#F4D96B' },
  { bg: '#F4D96B', a: '#241521', b: '#FF5A36', line: '#392438' },
  { bg: '#B7A0D9', a: '#241521', b: '#F7F1E8', line: '#392438' },
]

function hash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Gerador pseudo-aleatório simples a partir de uma semente. */
function random(seed: number) {
  let s = seed || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function ProjectArtwork({ slug, title, className }: { slug: string; title: string; className?: string }) {
  const seed = hash(slug)
  const rand = random(seed)
  const palette = palettes[seed % palettes.length] ?? palettes[0]!
  const nodes = Array.from({ length: 6 }, () => ({ x: 60 + rand() * 280, y: 40 + rand() * 170, r: 4 + rand() * 10 }))
  const big = { x: 220 + rand() * 120, y: 60 + rand() * 120, r: 50 + rand() * 40 }
  const initial = title
    .replace(/^\[.*?\]\s*/, '')
    .charAt(0)
    .toUpperCase()

  return (
    <svg viewBox="0 0 400 250" className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="250" fill={palette.bg} />
      <g stroke={palette.line} strokeOpacity="0.25" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="250" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} />
        ))}
      </g>
      <circle cx={big.x} cy={big.y} r={big.r} fill={palette.a} />
      <g stroke={palette.line} strokeWidth="1.5" fill="none">
        {nodes.slice(1).map((node, i) => {
          const prev = nodes[i]!
          return <path key={i} d={`M${prev.x} ${prev.y} L${node.x} ${prev.y} L${node.x} ${node.y}`} />
        })}
      </g>
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={node.r / 2 + 2}
          fill={i % 2 ? palette.b : palette.bg}
          stroke={palette.b}
          strokeWidth="2"
        />
      ))}
      <text
        x="56"
        y="212"
        fill={palette.b}
        fontFamily="Bricolage Grotesque Variable, sans-serif"
        fontWeight="800"
        fontSize="64"
        opacity="0.9"
      >
        {initial}
      </text>
    </svg>
  )
}
