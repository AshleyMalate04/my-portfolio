import { useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { useFinePointer } from './useFinePointer'

/** Desloca ligeiramente o filho na direcção do cursor (botões e CTAs). */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const ref = useRef<HTMLDivElement>(null)

  if (reduce || !fine) return <div className={className ?? 'inline-flex'}>{children}</div>

  return (
    <div
      ref={ref}
      className={className ?? 'inline-flex'}
      onPointerMove={(event) => {
        const node = ref.current
        if (!node) return
        const rect = node.getBoundingClientRect()
        const x = (event.clientX - rect.left - rect.width / 2) * 0.22
        const y = (event.clientY - rect.top - rect.height / 2) * 0.22
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = 'translate3d(0, 0, 0)'
      }}
      style={{ transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {children}
    </div>
  )
}
