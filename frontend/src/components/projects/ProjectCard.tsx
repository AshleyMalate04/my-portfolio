import { ArrowUpRight } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { Tilt } from '../motion/Parallax'
import { motionDuration, motionEase } from '../motion/config'
import { useLocale } from '../../i18n/context'
import { formatMonthYear, isSafeUrl } from '../../lib/format'
import type { ProjectSummary } from '../../lib/api/types'
import { paths } from '../../routes/paths'
import { ProjectArtwork } from '../ui/ProjectArtwork'
import { ResponsiveImage } from '../ui/ResponsiveImage'
import { StatusBadge } from '../ui/StatusBadge'

interface ProjectCardProps {
  project: ProjectSummary
  /** Cartão maior, usado no primeiro destaque. */
  large?: boolean
  headingLevel?: 'h3' | 'h2'
}

/**
 * Cartão de projecto. O título é o link principal e cobre o cartão inteiro;
 * demonstração e repositório só aparecem quando existem, por cima dessa área.
 */
export function ProjectCard({ project, large = false, headingLevel = 'h3' }: ProjectCardProps) {
  const { locale, t } = useLocale()
  const reduce = useReducedMotion()
  const Heading = headingLevel
  const year = formatMonthYear(project.started_at, locale)

  return (
    <Tilt className="group relative flex h-full flex-col">
      <article className="relative flex h-full flex-col">
        <div
          className="relative overflow-hidden rounded-card bg-band"
          style={{ viewTransitionName: `project-cover-${project.slug}` }}
        >
          <m.div
            className={large ? 'aspect-[2/1]' : 'aspect-video'}
            {...(reduce
              ? {}
              : {
                  initial: { clipPath: 'inset(0 0 100% 0)' },
                  whileInView: { clipPath: 'inset(0 0 0% 0)' },
                  viewport: { once: true, margin: '0px 0px -8% 0px' },
                  transition: { duration: motionDuration.slow, ease: motionEase },
                })}
          >
            {project.cover ? (
              <ResponsiveImage
                media={project.cover}
                alt=""
                sizes={
                  large ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                }
                className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.06] motion-reduce:transition-none"
              />
            ) : (
              <ProjectArtwork
                slug={project.slug}
                title={project.title}
                className="h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.06] motion-reduce:transition-none"
              />
            )}
          </m.div>
          {project.is_featured && (
            <span className="absolute top-4 left-4 rounded-pill bg-highlight px-3 py-1 text-xs font-semibold text-plum-950">
              {t.projects.featured}
            </span>
          )}
          <span
            aria-hidden="true"
            className="absolute right-4 bottom-4 flex size-12 items-center justify-center rounded-full bg-accent text-plum-950 opacity-0 transition-[opacity,transform] duration-base group-hover:opacity-100 group-hover:-translate-y-1 group-focus-within:opacity-100"
          >
            <ArrowUpRight className="size-5" />
          </span>
        </div>

        <div className="flex flex-1 flex-col pt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            {project.category && <span>{project.category.name}</span>}
            {project.category && year && <span aria-hidden="true">·</span>}
            {year && <span>{year}</span>}
            <span className="ml-auto">
              <StatusBadge status={project.project_status} />
            </span>
          </div>

          <Heading className={`mt-2 font-display leading-tight font-bold ${large ? 'text-2xl' : 'text-xl'}`}>
            <Link
              to={paths.project(locale, project.slug)}
              viewTransition
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none [&:focus-visible]:after:rounded-card [&:focus-visible]:after:outline-3 [&:focus-visible]:after:outline-offset-4 [&:focus-visible]:after:outline-focus"
            >
              {project.title}
            </Link>
          </Heading>

          {project.summary && <p className="mt-3 text-ink-muted">{project.summary}</p>}

          {project.technologies.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={t.project.technologies}>
              {project.technologies.map((technology, i) => (
                <li
                  key={technology.slug}
                  className="rounded-pill bg-ink/5 px-2.5 py-1 text-xs font-medium transition-transform duration-fast hover:scale-105"
                  style={reduce ? undefined : { animationDelay: `${i * 40}ms` }}
                >
                  {technology.name}
                </li>
              ))}
            </ul>
          )}

          {(isSafeUrl(project.demo_url) || isSafeUrl(project.repository_url)) && (
            <div className="relative z-10 mt-auto flex flex-wrap gap-4 pt-5 text-sm font-medium">
              {isSafeUrl(project.demo_url) && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex min-h-11 items-center gap-1 text-accent-ink"
                >
                  {t.projects.demo}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              )}
              {isSafeUrl(project.repository_url) && (
                <a
                  href={project.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex min-h-11 items-center gap-1 text-accent-ink"
                >
                  {t.projects.repository}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </article>
    </Tilt>
  )
}
