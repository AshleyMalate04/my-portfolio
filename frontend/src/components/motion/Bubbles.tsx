import { useReducedMotion } from 'motion/react'
import type { CSSProperties } from 'react'

type Hue = 'accent' | 'support' | 'highlight'

interface Bubble {
  left: number
  size: number
  duration: number
  delay: number
  sway: number
  hue: Hue
  ring: boolean
}

const hues: Hue[] = ['accent', 'support', 'highlight']

/** Gerador determinístico: as bolhas ficam iguais em cada visita e entre renderizações. */
function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function makeBubbles(count: number, seed: number): Bubble[] {
  const random = seeded(seed)
  return Array.from({ length: count }, (_, i) => {
    const size = Math.round(8 + random() * 72)
    return {
      left: Math.round(random() * 96),
      size,
      // Bolhas grandes estão "mais perto": sobem mais depressa e mais nítidas.
      duration: Math.round(34 - (size / 80) * 16 + random() * 8),
      delay: -Math.round(random() * 30),
      sway: Math.round(12 + random() * 36) * (i % 2 === 0 ? 1 : -1),
      hue: hues[i % hues.length]!,
      ring: random() > 0.62,
    }
  })
}

/**
 * Bolhas e partículas que sobem devagar, em planos diferentes (tamanho, desfoque e
 * opacidade variam com a "distância"). Decorativas, sem interceptar cliques.
 */
export function Bubbles({
  count = 16,
  seed = 7,
  className = '',
}: {
  count?: number
  seed?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  if (reduce) return null

  return (
    <div
      aria-hidden="true"
      className={`bubbles pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      {makeBubbles(count, seed).map((bubble, i) => {
        const depth = bubble.size / 80
        const style = {
          left: `${bubble.left}%`,
          width: bubble.size,
          height: bubble.size,
          animationDuration: `${bubble.duration}s`,
          animationDelay: `${bubble.delay}s`,
          '--bubble-sway': `${bubble.sway}px`,
          '--bubble-opacity': (0.18 + depth * 0.3).toFixed(2),
          filter: depth < 0.35 ? 'blur(1.5px)' : undefined,
        } as CSSProperties
        return (
          <span
            key={i}
            className={`bubble bubble-${bubble.hue} ${bubble.ring ? 'bubble-ring' : ''} ${i % 2 === 1 ? 'hidden sm:block' : ''}`}
            style={style}
          />
        )
      })}
    </div>
  )
}
