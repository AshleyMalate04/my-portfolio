import { Reveal } from '../components/motion/Reveal'
import { ScrollDepth } from '../components/motion/ScrollDepth'
import { ResponsiveImage } from '../components/ui/ResponsiveImage'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useLocale } from '../i18n/context'
import type { Testimonial } from '../lib/api/types'
import { sectionIds } from '../routes/paths'

/** Só é renderizada quando a API devolve testemunhos publicados e autorizados. */
export function TestimonialsSection({
  testimonials,
  surface = 'base',
}: {
  testimonials: Testimonial[]
  surface?: 'base' | 'alt'
}) {
  const { locale, t } = useLocale()

  return (
    <section
      id={sectionIds[locale].testimonials}
      aria-labelledby="testimonials-title"
      className={`relative scroll-mt-20 py-12 sm:py-16 ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={t.testimonials.title} id="testimonials-title" />
        <ul className="grid gap-8 md:grid-cols-2">
          {testimonials.map((item, i) => (
            <Reveal as="li" from={i % 2 === 0 ? 'left' : 'right'} key={item.id} delay={(i % 2) * 0.08}>
              <ScrollDepth y={i % 2 === 0 ? 16 : -22} className="h-full">
                <figure className="flex h-full flex-col rounded-card bg-surface-raised p-8 shadow-card transition-transform duration-base hover:-translate-y-1">
                  <span aria-hidden="true" className="font-display text-5xl leading-none text-accent">
                    “
                  </span>
                  <blockquote className="mt-2 flex-1 text-lg leading-relaxed">{item.quote}</blockquote>
                  <figcaption className="mt-8 flex items-center gap-4">
                    {item.author_photo && (
                      <ResponsiveImage media={item.author_photo} alt="" className="size-12 rounded-full object-cover" />
                    )}
                    <span>
                      <span className="block font-medium">{item.author_name}</span>
                      {(item.author_role || item.author_organization) && (
                        <span className="block text-sm text-ink-muted">
                          {[item.author_role, item.author_organization].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              </ScrollDepth>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
