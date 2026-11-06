import { FloatingField } from '../components/motion/FloatingField'
import { Reveal } from '../components/motion/Reveal'
import { SectionHeader } from '../components/ui/SectionHeader'
import { tagStyle } from '../components/ui/styles'
import { useLocale } from '../i18n/context'
import { interpolate } from '../i18n/messages'
import type { Education, Profile } from '../lib/api/types'
import { sectionIds } from '../routes/paths'

/**
 * Sobre mim: biografia longa, abordagem, objectivos, formação e interesses — só o que está preenchido.
 * A apresentação curta já aparece no hero, por isso não é repetida aqui.
 */
export function AboutSection({
  profile,
  education,
  surface = 'base',
}: {
  profile: Profile
  education: Education[]
  surface?: 'base' | 'alt'
}) {
  const { locale, t } = useLocale()
  const paragraphs = profile.long_bio?.split(/\n{2,}/).filter(Boolean) ?? []
  const hasNarrative = paragraphs.length > 0 || Boolean(profile.approach || profile.goals)
  const interests = profile.interests
  const firstName = profile.full_name.split(' ')[0] ?? ''

  return (
    <section
      aria-labelledby="about-title"
      className={`relative scroll-mt-20 py-12 sm:py-16 ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
      id={sectionIds[locale].about}
    >
      <FloatingField tone="quiet" />
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={interpolate(t.about.title, { name: firstName })} id="about-title" />

        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal from="left" className="space-y-6 text-lg leading-relaxed lg:col-span-7">
            {hasNarrative ? (
              <>
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className={i === 0 ? 'text-lg text-ink sm:text-xl' : 'text-ink-muted'}>
                    {paragraph}
                  </p>
                ))}
                {(profile.approach || profile.goals) && (
                  <dl className="grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
                    {profile.approach && <Fact label={t.about.approach}>{profile.approach}</Fact>}
                    {profile.goals && <Fact label={t.about.goals}>{profile.goals}</Fact>}
                  </dl>
                )}
              </>
            ) : (
              interests.length > 0 && (
                <div>
                  <h3 className="font-display text-xl font-bold">{t.about.interests}</h3>
                  <ul className="mt-5 flex flex-wrap gap-3">
                    {interests.map((interest) => (
                      <li
                        key={interest}
                        className="rounded-pill border border-ink/15 px-5 py-2.5 font-display text-base font-semibold transition-colors hover:border-accent hover:bg-accent hover:text-plum-950"
                      >
                        {interest}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </Reveal>

          <Reveal from="right" delay={0.12} className="lg:col-span-5">
            <div className="relative rounded-card bg-surface-raised p-6 shadow-card sm:p-8 lg:sticky lg:top-24">
              <span aria-hidden="true" className="absolute -top-3 left-8 h-6 w-16 rotate-[-4deg] bg-butter-300/80" />

              {education.length > 0 && (
                <div>
                  <h3 className="font-display text-xl font-bold">{t.about.education}</h3>
                  <ul className="mt-4 space-y-5">
                    {education.map((item) => (
                      <li key={item.id}>
                        <p className="font-display text-xl leading-tight font-bold">{item.degree}</p>
                        <p className="mt-2 text-ink-muted">
                          {item.institution}
                          {item.institution_short_name && ` (${item.institution_short_name})`}
                        </p>
                        {item.is_current && (
                          <span className="mt-3 inline-block rounded-pill bg-highlight px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-plum-950">
                            {t.about.current}
                          </span>
                        )}
                        {item.specialization && (
                          <p className="mt-4 border-l-2 border-accent pl-3">
                            <span className="block text-sm text-ink-muted">{t.about.specialization}</span>
                            {item.specialization}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasNarrative && interests.length > 0 && (
                <div className={education.length > 0 ? 'mt-8 border-t border-line pt-6' : ''}>
                  <h3 className="font-display text-xl font-bold">{t.about.interests}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <li key={interest} className={`${tagStyle} border-ink/15 font-sans text-sm`}>
                        {interest}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="font-display text-lg font-bold">{label}</dt>
      <dd className="mt-2 text-base leading-relaxed text-ink-muted">{children}</dd>
    </div>
  )
}
