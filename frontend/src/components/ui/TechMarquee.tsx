import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Fragment } from 'react'

/** Faixa em movimento com as tecnologias que uso. Decorativa: a lista completa está em "Competências". */
export function TechMarquee({ items }: { items: string[] }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const shift = useTransform(scrollY, (value) => -value * 0.35)

  if (items.length < 3) return null
  // Duas voltas completas por cópia garantem que a faixa cobre ecrãs largos.
  const loop = [...items, ...items]

  return (
    <div
      aria-hidden="true"
      className="marquee relative overflow-hidden border-y-2 border-plum-950 bg-accent py-3 text-plum-950"
    >
      <m.div style={reduce ? undefined : { x: shift }}>
        <div className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {loop.map((name, i) => (
                <Fragment key={`${name}-${i}`}>
                  <li className="px-5 font-display text-lg font-bold whitespace-nowrap sm:text-xl">{name}</li>
                  <li className="text-xl">✦</li>
                </Fragment>
              ))}
            </ul>
          ))}
        </div>
      </m.div>
    </div>
  )
}
