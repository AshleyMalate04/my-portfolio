import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { useFinePointer } from './useFinePointer'

/** Desloca um elemento em função da posição do rato, em planos diferentes. */
export function Parallax({
  children,
  className,
  strength = 12,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 80, damping: 20, restDelta: 0.001 })
  const springY = useSpring(y, { stiffness: 80, damping: 20, restDelta: 0.001 })

  useEffect(() => {
    if (reduce || !fine) return
    const onMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth - 0.5) * 2
      const ny = (event.clientY / window.innerHeight - 0.5) * 2
      x.set(nx * strength)
      y.set(ny * strength)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [fine, reduce, strength, x, y])

  if (reduce || !fine) return <div className={className}>{children}</div>

  return (
    <m.div className={className} style={{ x: springX, y: springY }}>
      {children}
    </m.div>
  )
}

/** Inclinação 3D subtil de um cartão em direcção ao ponteiro. */
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 180, damping: 18 })
  const springY = useSpring(rotateY, { stiffness: 180, damping: 18 })
  const transform = useMotionTemplate`perspective(900px) rotateX(${springX}deg) rotateY(${springY}deg)`
  const glareX = useTransform(springY, [-6, 6], [20, 80])
  const glareY = useTransform(springX, [6, -6], [20, 80])
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.14), transparent 55%)`

  if (reduce || !fine) return <div className={className}>{children}</div>

  return (
    <m.div
      className={className}
      style={{ transform, transformStyle: 'preserve-3d' }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width
        const py = (event.clientY - rect.top) / rect.height
        rotateY.set((px - 0.5) * 8)
        rotateX.set((0.5 - py) * 8)
      }}
      onPointerLeave={() => {
        rotateX.set(0)
        rotateY.set(0)
      }}
    >
      {children}
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-base group-hover:opacity-100"
        style={{ background: glare }}
      />
    </m.div>
  )
}
