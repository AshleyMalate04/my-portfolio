import { Reveal } from '../components/motion/Reveal'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useLocale } from '../i18n/context'
import type { SkillCategory } from '../lib/api/types'
import { sectionIds } from '../routes/paths'

/** Competências por área, sobre fundo ameixa. Sem barras nem percentagens. */
export function SkillsSection({ categories }: { categories: SkillCategory[] }) {
  const { locale, t } = useLocale()

  return (
    <section
      id={sectionIds[locale].skills}
      aria-labelledby="skills-title"
      className="relative scroll-mt-20 bg-band py-12 text-band-ink sm:py-16"
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={t.skills.title} id="skills-title" tone="dark" />

        <ul className="grid gap-px overflow-hidden rounded-card bg-band-line sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <Reveal
              as="li"
              from="scale"
              key={category.slug}
              delay={(i % 3) * 0.07}
              className="bg-band p-6 sm:p-8 transition-colors hover:bg-band-raised"
            >
              <h3 className="font-display text-xl font-bold">{category.name}</h3>
              {category.description && <p className="mt-2 text-sm text-band-muted">{category.description}</p>}
              <ul className="mt-6 flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill.name}
                    title={skill.description ?? undefined}
                    className="rounded-pill border border-band-line px-3 py-1.5 text-sm transition-transform duration-fast hover:scale-105 hover:border-highlight hover:text-highlight"
                  >
                    {skill.name}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
