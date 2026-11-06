import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from '../components/motion/Reveal'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useLocale } from '../i18n/context'
import { formatMonthYear, formatPeriod, isSafeUrl } from '../lib/format'
import type { Journey } from '../lib/api/types'
import { sectionIds } from '../routes/paths'

interface TimelineEntry {
  key: string
  period: string | null
  tag?: string
  title: string
  subtitle: string
  body?: string | null
  links?: { href: string; label: string }[]
}

/** Percurso: formação, experiência e certificações. Datas só quando existem. */
export function JourneySection({ journey, surface = 'base' }: { journey: Journey; surface?: 'base' | 'alt' }) {
  const { locale, t } = useLocale()
  const current = t.journey.current

  const groups: { key: string; title: string; entries: TimelineEntry[] }[] = [
    {
      key: 'education',
      title: t.journey.education,
      entries: journey.education.map((item) => ({
        key: `e${item.id}`,
        period: formatPeriod(item.started_at, item.ended_at, item.is_current, locale, current),
        title: item.degree,
        subtitle: [item.institution, item.location].filter(Boolean).join(' · '),
        body: [item.specialization, item.description].filter(Boolean).join('. ') || null,
      })),
    },
    {
      key: 'experience',
      title: t.journey.experience,
      entries: journey.experience.map((item) => ({
        key: `x${item.id}`,
        period: formatPeriod(item.started_at, item.ended_at, item.is_current, locale, current),
        tag: t.journey.employmentType[item.employment_type],
        title: item.role,
        subtitle: [item.organization, item.location].filter(Boolean).join(' · '),
        body: item.description,
      })),
    },
    {
      key: 'certifications',
      title: t.journey.certifications,
      entries: journey.certifications.map((item) => ({
        key: `c${item.id}`,
        period: formatMonthYear(item.issued_at, locale),
        tag: t.journey.certificationKind[item.kind],
        title: item.name,
        subtitle: item.issuer,
        body: item.description,
        links: [
          ...(isSafeUrl(item.credential_url) ? [{ href: item.credential_url, label: t.journey.credential }] : []),
          ...(isSafeUrl(item.document_url) ? [{ href: item.document_url, label: t.journey.document }] : []),
        ],
      })),
    },
  ].filter((group) => group.entries.length > 0)

  return (
    <section
      id={sectionIds[locale].journey}
      aria-labelledby="journey-title"
      className={`relative scroll-mt-20 py-12 sm:py-16 ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={t.journey.title} id="journey-title" />

        <div className="grid gap-14">
          {groups.map((group) => (
            <div key={group.key} className="grid gap-6 lg:grid-cols-12">
              <h3 className="font-mono text-xs tracking-[0.16em] text-accent-ink uppercase lg:col-span-3 lg:pt-2">
                {group.title}
              </h3>
              <ol className="relative border-l border-ink/15 lg:col-span-9">
                {group.entries.map((entry, i) => (
                  <Reveal
                    as="li"
                    from="left"
                    key={entry.key}
                    delay={i * 0.05}
                    className="relative pb-10 pl-8 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-2.5 -left-[5px] size-[9px] rounded-full bg-accent ring-4 ${surface === 'alt' ? 'ring-surface-alt' : 'ring-surface'}`}
                    />
                    <TimelineMeta period={entry.period} tag={entry.tag} />
                    <p className="mt-2 font-display text-xl leading-tight font-bold">{entry.title}</p>
                    <p className="mt-1 text-ink-muted">{entry.subtitle}</p>
                    {entry.body && (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">{entry.body}</p>
                    )}
                    {entry.links && entry.links.length > 0 && (
                      <p className="mt-3 flex flex-wrap gap-4">
                        {entry.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-underline inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent-ink"
                          >
                            {link.label}
                            <ArrowUpRight aria-hidden="true" className="size-4" />
                          </a>
                        ))}
                      </p>
                    )}
                  </Reveal>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineMeta({ period, tag }: { period: string | null; tag?: string }): ReactNode {
  if (!period && !tag) return null

  return (
    <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-ink-muted">
      {period && <span>{period}</span>}
      {tag && <span className="rounded-pill bg-lavender-300/40 px-2 py-0.5 text-plum-950">{tag}</span>}
    </p>
  )
}
