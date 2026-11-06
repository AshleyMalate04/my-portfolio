import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '../components/motion/Reveal'
import { SectionHeader } from '../components/ui/SectionHeader'
import { ServiceIcon } from '../components/ui/ServiceIcon'
import { buttonStyles } from '../components/ui/styles'
import { useLocale } from '../i18n/context'
import type { Service } from '../lib/api/types'
import { paths, sectionIds } from '../routes/paths'

/** Serviços publicados. Sem preços nem prazos; a acção leva à secção de contacto. */
export function ServicesSection({
  services,
  showContact,
  surface = 'base',
}: {
  services: Service[]
  showContact: boolean
  surface?: 'base' | 'alt'
}) {
  const { locale, t } = useLocale()

  return (
    <section
      id={sectionIds[locale].services}
      aria-labelledby="services-title"
      className={`relative scroll-mt-20 py-12 sm:py-16 ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={t.services.title} id="services-title" />

        <ul className={`grid border-t border-ink/15 ${services.length > 1 ? 'md:grid-cols-2' : 'max-w-3xl'}`}>
          {services.map((service, i) => (
            <Reveal
              as="li"
              from={i % 2 === 0 ? 'left' : 'right'}
              key={service.slug}
              delay={(i % 2) * 0.08}
              className={`group grid grid-cols-[auto_1fr] gap-x-5 border-b border-ink/15 py-8 transition-colors hover:bg-ink/[0.03] ${services.length > 1 ? 'md:odd:border-r md:odd:pr-8 md:even:pl-8' : ''}`}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-support/40 text-plum-950 transition-[transform,background-color] duration-base group-hover:scale-110 group-hover:bg-accent">
                <ServiceIcon name={service.icon} className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xl leading-tight font-bold">{service.title}</h3>
                {service.summary && <p className="mt-2 text-ink-muted">{service.summary}</p>}
                {service.description && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{service.description}</p>
                )}
              </div>
            </Reveal>
          ))}
        </ul>

        {showContact && (
          <Reveal className="mt-12">
            <Link to={paths.section(locale, 'contact')} className={`${buttonStyles.dark} group`}>
              {t.services.cta}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  )
}
