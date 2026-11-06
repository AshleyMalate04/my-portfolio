import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '../components/motion/Reveal'
import { ScrollDepth } from '../components/motion/ScrollDepth'
import { ProjectCard } from '../components/projects/ProjectCard'
import { SectionHeader } from '../components/ui/SectionHeader'
import { buttonStyles } from '../components/ui/styles'
import { useLocale } from '../i18n/context'
import type { HomeData, ProjectSummary } from '../lib/api/types'
import { paths, sectionIds } from '../routes/paths'

const HOME_LIMIT = 2

/** Projectos em destaque na página inicial, com ligação para a página de todos os projectos. */
export function ProjectsSection({ data, surface = 'base' }: { data: HomeData; surface?: 'base' | 'alt' }) {
  const { locale, t } = useLocale()
  const { items, total } = data.projects
  const preview = items.slice(0, HOME_LIMIT)

  return (
    <section
      id={sectionIds[locale].projects}
      aria-labelledby="projects-title"
      className={`relative scroll-mt-20 py-12 sm:py-16 ${surface === 'alt' ? 'bg-surface-alt' : 'bg-surface'}`}
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeader title={t.projects.title} id="projects-title" />

        <ProjectGrid projects={preview} />

        {total > 0 && (
          <div className="mt-14 flex justify-center">
            <Link to={paths.projects(locale)} className={`${buttonStyles.outline} group`}>
              {t.projects.viewAll}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Grelha que se adapta ao número de projectos para nunca deixar colunas vazias:
 * 1 → um cartão largo; 2 ou 4 → duas colunas; 5, 8… → primeiro cartão a ocupar duas colunas; resto → três.
 */
export function ProjectGrid({
  projects,
  headingLevel = 'h3',
}: {
  projects: ProjectSummary[]
  headingLevel?: 'h2' | 'h3'
}) {
  const count = projects.length
  const columns =
    count === 1 ? 'grid-cols-1' : count === 2 || count === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  const leadSpans = count >= 5 && (count - 2) % 3 === 0

  return (
    <ul className={`grid gap-x-8 gap-y-14 ${columns}`}>
      {projects.map((project, i) => {
        const large = count === 1 || (leadSpans && i === 0)
        return (
          <Reveal
            as="li"
            from={i % 2 === 0 ? 'up' : 'scale'}
            key={project.slug}
            delay={(i % 3) * 0.07}
            className={large && count > 1 ? 'sm:col-span-2' : ''}
          >
            <ScrollDepth y={count > 1 ? (i % 2 === 0 ? 18 : -26) : 0} className="h-full">
              <ProjectCard project={project} large={large} headingLevel={headingLevel} />
            </ScrollDepth>
          </Reveal>
        )
      })}
    </ul>
  )
}
