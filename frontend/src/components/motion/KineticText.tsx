import { m, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { motionEase } from './config'
import { useFinePointer } from './useFinePointer'

const HEAVY = 800
const LIGHT = 340
const RADIUS = 180

/**
 * Tipografia cinética: as letras surgem uma a uma e depois transformam-se com o rato —
 * o peso da fonte variável diminui e a letra levanta ligeiramente à medida que o cursor
 * se aproxima. Em ecrãs tácteis, uma onda única percorre a palavra depois de aparecer.
 */
export function KineticText({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const rootRef = useRef<HTMLSpanElement>(null)
  const letters = [...text]

  useEffect(() => {
    if (reduce) return
    const root = rootRef.current
    if (!root) return
    const nodes = [...root.querySelectorAll<HTMLElement>('[data-letter]')]
    const weights = nodes.map(() => HEAVY)
    let frame = 0

    const paint = (index: number, weight: number) => {
      const node = nodes[index]
      if (!node) return
      const lift = ((HEAVY - weight) / (HEAVY - LIGHT)) * -0.08
      node.style.fontVariationSettings = `'wght' ${Math.round(weight)}`
      node.style.transform = `translateY(${lift}em)`
    }

    if (!fine) {
      // Onda única depois da entrada das letras.
      const start = performance.now() + (delay + 0.9 + letters.length * 0.06) * 1000
      const wave = (now: number) => {
        const t = (now - start) / 1000
        if (t > letters.length * 0.09 + 0.8) {
          nodes.forEach((_, i) => paint(i, HEAVY))
          return
        }
        nodes.forEach((_, i) => {
          const phase = Math.max(0, Math.min(1, t * 2.4 - i * 0.22))
          paint(i, HEAVY - Math.sin(phase * Math.PI) * (HEAVY - LIGHT))
        })
        frame = requestAnimationFrame(wave)
      }
      frame = requestAnimationFrame(wave)
      return () => cancelAnimationFrame(frame)
    }

    let pointerX = -9999
    let pointerY = -9999
    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
    }

    const tick = () => {
      nodes.forEach((node, i) => {
        const box = node.getBoundingClientRect()
        const distance = Math.hypot(box.left + box.width / 2 - pointerX, box.top + box.height / 2 - pointerY)
        const closeness = Math.max(0, 1 - distance / RADIUS)
        const target = HEAVY - closeness ** 1.5 * (HEAVY - LIGHT)
        weights[i] = weights[i]! + (target - weights[i]!) * 0.14
        paint(i, weights[i]!)
      })
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [delay, fine, letters.length, reduce])

  if (reduce) return <>{text}</>

  return (
    <span ref={rootRef} className="inline-block whitespace-nowrap">
      <span className="sr-only">{text}</span>
      {letters.map((letter, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <m.span
            className="inline-block"
            initial={{ y: '110%', rotate: 12, opacity: 0 }}
            animate={{ y: '0%', rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: motionEase, delay: delay + i * 0.06 }}
          >
            {/* A entrada anima o m.span; o peso e o levantamento mexem neste span interior. */}
            <span data-letter className="inline-block will-change-transform">
              {letter}
            </span>
          </m.span>
        </span>
      ))}
    </span>
  )
}
