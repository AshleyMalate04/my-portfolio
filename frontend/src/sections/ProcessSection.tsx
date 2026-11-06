import { Reveal } from '../components/motion/Reveal'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useLocale } from '../i18n/context'
import type { ProcessStep } from '../lib/api/types'
import { sectionIds } from '../routes/paths'

/** Metodologia: etapas numeradas ligadas por uma linha — apresentada como abordagem, não promessa. */
export function ProcessSection({ steps, surface = 'base' }: { steps: ProcessStep[]; surface?: 'base' | 'alt' }) {
  const { locale, t } = useLocale()

  return (
    <section
      id={sectionIds[locale].process}
      aria-labelledby="process-title"
      className={`relative scroll-mt-20 py-12 sm:py-16 ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={t.process.title} id="process-title" />

        <ol className="relative grid gap-10 lg:grid-cols-5 lg:gap-6">
          <span
            aria-hidden="true"
            className="absolute top-5 bottom-5 left-5 w-px bg-ink/15 lg:top-5 lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-full"
          />
          {steps.map((step, i) => (
            <Reveal
              as="li"
              from="scale"
              key={step.id}
              delay={i * 0.09}
              className="relative grid grid-cols-[auto_1fr] gap-5 lg:block"
            >
              <span
                className={`relative flex size-10 items-center justify-center rounded-full border border-ink font-mono text-xs font-medium ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="lg:mt-6">
                <h3 className="font-display text-xl leading-tight font-bold">{step.title}</h3>
                {step.description && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
