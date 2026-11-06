import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useFinePointer } from './useFinePointer'

interface Mark {
  x: number
  y: number
  size: number
  kind: 'dot' | 'diamond' | 'glyph'
  glyph: string
  hue: 'accent' | 'highlight' | 'support'
}

const marks: Mark[] = [
  { x: 12, y: 22, size: 9, kind: 'dot', glyph: '', hue: 'accent' },
  { x: 28, y: 68, size: 7, kind: 'diamond', glyph: '', hue: 'highlight' },
  { x: 46, y: 18, size: 8, kind: 'glyph', glyph: '{', hue: 'support' },
  { x: 62, y: 74, size: 10, kind: 'dot', glyph: '', hue: 'support' },
  { x: 78, y: 30, size: 7, kind: 'diamond', glyph: '', hue: 'accent' },
  { x: 88, y: 58, size: 8, kind: 'glyph', glyph: '}', hue: 'highlight' },
  { x: 18, y: 48, size: 6, kind: 'dot', glyph: '', hue: 'highlight' },
  { x: 70, y: 14, size: 7, kind: 'glyph', glyph: '/', hue: 'accent' },
  { x: 54, y: 86, size: 8, kind: 'diamond', glyph: '', hue: 'support' },
  { x: 36, y: 36, size: 6, kind: 'dot', glyph: '', hue: 'accent' },
]

const fill = {
  accent: 'color-mix(in srgb, var(--accent) 70%, transparent)',
  highlight: 'color-mix(in srgb, var(--highlight) 75%, transparent)',
  support: 'color-mix(in srgb, var(--support) 70%, transparent)',
} as const

/**
 * Pequenas marcas abstractas que vagueiam e fogem do cursor.
 * Só em dispositivos com rato; não interceptam cliques.
 */
export function FleeingMarks() {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce || !fine) return
    const root = rootRef.current
    if (!root) return

    const nodes = [...root.querySelectorAll<HTMLElement>('[data-mark]')]
    const home = marks.map((mark) => ({ ...mark, ox: 0, oy: 0 }))
    let pointerX = -9999
    let pointerY = -9999
    let frame = 0
    let time = 0

    const onMove = (event: PointerEvent) => {
      const box = root.getBoundingClientRect()
      pointerX = event.clientX - box.left
      pointerY = event.clientY - box.top
    }

    const tick = () => {
      time += 0.016
      const box = root.getBoundingClientRect()
      home.forEach((mark, index) => {
        const node = nodes[index]
        if (!node) return

        const homeX = (mark.x / 100) * box.width
        const homeY = (mark.y / 100) * box.height
        const wanderX = Math.sin(time * (0.6 + index * 0.07) + index) * 18
        const wanderY = Math.cos(time * (0.5 + index * 0.05) + index * 1.3) * 16

        const dx = homeX - pointerX
        const dy = homeY - pointerY
        const dist = Math.hypot(dx, dy)
        const radius = 140
        let fleeX = 0
        let fleeY = 0
        if (dist < radius && dist > 0.01) {
          const force = ((radius - dist) / radius) ** 1.4 * 70
          fleeX = (dx / dist) * force
          fleeY = (dy / dist) * force
        }

        mark.ox += (wanderX + fleeX - mark.ox) * 0.12
        mark.oy += (wanderY + fleeY - mark.oy) * 0.12
        node.style.transform = `translate3d(${mark.ox}px, ${mark.oy}px, 0)`
      })
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [fine, reduce])

  if (reduce) return null

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {marks.map((mark, index) => (
        <span
          key={index}
          data-mark
          className="absolute will-change-transform"
          style={{
            left: `${mark.x}%`,
            top: `${mark.y}%`,
            width: mark.size,
            height: mark.size,
            color: fill[mark.hue],
            background: mark.kind === 'glyph' ? 'transparent' : fill[mark.hue],
            borderRadius: mark.kind === 'dot' ? '999px' : mark.kind === 'diamond' ? '2px' : 0,
            transform: mark.kind === 'diamond' ? 'rotate(45deg)' : undefined,
            fontSize: mark.kind === 'glyph' ? 14 : undefined,
            lineHeight: 1,
            fontFamily: 'JetBrains Mono Variable, ui-monospace, monospace',
            opacity: 0.55,
          }}
        >
          {mark.kind === 'glyph' ? mark.glyph : null}
        </span>
      ))}
    </div>
  )
}
