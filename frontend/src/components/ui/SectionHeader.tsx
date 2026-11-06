import { useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Reveal, type RevealFrom } from '../motion/Reveal'
import { ScrollDepth } from '../motion/ScrollDepth'
import { TextReveal } from '../motion/TextReveal'

interface SectionHeaderProps {
  title: string
  id: string
  intro?: ReactNode
  tone?: 'light' | 'dark'
  from?: RevealFrom
}

/** Cabeçalho das secções: uma barra de cor e um título grande, sem rótulos nem numeração. */
export function SectionHeader({ title, id, intro, tone = 'light', from = 'up' }: SectionHeaderProps) {
  const reduce = useReducedMotion()
  const muted = tone === 'dark' ? 'text-band-muted' : 'text-ink-muted'

  return (
    <Reveal from={from} className="mb-8 md:mb-10">
      <ScrollDepth x={-28} y={0} className="mb-4 w-fit">
        <span aria-hidden="true" className="block h-1 w-12 rounded-full bg-accent" />
      </ScrollDepth>
      <h2
        id={id}
        aria-label={reduce ? undefined : title}
        className="text-[clamp(2rem,4.2vw,3.25rem)] leading-tight font-bold tracking-tight text-balance"
      >
        <TextReveal text={title} />
      </h2>
      {intro && <div className={`mt-4 max-w-3xl text-base leading-relaxed sm:text-lg ${muted}`}>{intro}</div>}
    </Reveal>
  )
}
