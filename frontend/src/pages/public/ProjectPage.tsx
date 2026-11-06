import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Reveal, RevealLine } from '../../components/motion/Reveal'
import { QueryState } from '../../components/QueryState'
import { useSeo } from '../../components/seo/useSeo'
import { ProjectArtwork } from '../../components/ui/ProjectArtwork'
import { ResponsiveImage } from '../../components/ui/ResponsiveImage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { buttonStyles } from '../../components/ui/styles'
import { useLocale } from '../../i18n/context'
import { locales, type Locale } from '../../i18n/locales'
import { interpolate } from '../../i18n/messages'
import { formatPeriod, hostnameOf, isSafeUrl } from '../../lib/format'
import { publicApi } from '../../lib/api/public'
import { queryKeys } from '../../lib/api/queryKeys'
import type { Project } from '../../lib/api/types'
import { paths } from '../../routes/paths'
import { NotFoundPage } from '../NotFoundPage'

export function ProjectPage() {
  const { slug = '' } = useParams()
  const { locale, t } = useLocale()
  const project = useQuery({
    queryKey: queryKeys.project(locale, slug),
    queryFn: () => publicApi.project(locale, slug),
  })

  return (
    <QueryState query={project} empty={<NotFoundPage title={t.project.notFoundTitle} body={t.project.notFoundBody} />}>
      {(data) => <PublicProjectDetail project={data} />}
    </QueryState>
  )
}

/** Detalhe público: conteúdo + metadados SEO da página. */
function PublicProjectDetail({ project }: { project: Project }) {
  const { locale } = useLocale()

  useSeo({
    title: `${project.seo.title ?? project.title} — Ashley da Amena Mario Malate`,
    description: project.seo.description,
    locale,
    alternates: Object.fromEntries(locales.map((code) => [code, paths.project(code, project.slug)])) as Record<
      Locale,
      string
    >,
    image: project.cover?.url,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.summary ?? undefined,
      image: project.cover?.url,
      dateCreated: project.started_at ?? undefined,
      dateModified: project.updated_at ?? undefined,
      keywords: project.technologies.map((tech) => tech.name).join(', ') || undefined,
      creator: { '@type': 'Person', name: 'Ashley da Amena Mario Malate' },
    },
  })

  return <ProjectDetail project={project} />
}

/**
 * Conteúdo da página de um projecto. Também usado na pré-visualização do backoffice
 * (modo "preview"), onde não há ligações para fora do painel.
 */
export function ProjectDetail({ project, preview = false }: { project: Project; preview?: boolean }) {
  const { locale, t } = useLocale()
  const period = formatPeriod(project.started_at, project.ended_at, false, locale, t.project.current)
  const links = [
    isSafeUrl(project.demo_url) && { href: project.demo_url, label: t.projects.demo },
    isSafeUrl(project.repository_url) && { href: project.repository_url, label: t.projects.repository },
  ].filter((link): link is { href: string; label: string } => Boolean(link))

  // Só as secções com conteúdo publicado.
  const narrative: { key: string; title: string; content: string | null }[] = [
    { key: 'description', title: t.project.overview, content: project.description },
    { key: 'problem', title: t.project.context, content: project.problem },
    { key: 'objective', title: t.project.objective, content: project.objective },
    { key: 'solution', title: t.project.solution, content: project.solution },
    { key: 'contribution', title: t.project.contribution, content: project.contribution },
    { key: 'challenges', title: t.project.challenges, content: project.challenges },
    { key: 'results', title: t.project.results, content: project.results },
  ].filter((block) => block.content)

  return (
    <article className="pb-24">
      <header className="mx-auto max-w-content px-4 pt-8 sm:px-6 sm:pt-12">
        {!preview && (
          <Link
            to={paths.projects(locale)}
            className="group inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-4 transition-transform group-hover:-translate-x-1" />
            {t.project.back}
          </Link>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          {project.category && <span>{project.category.name}</span>}
          <span>
            <StatusBadge status={project.project_status} />
          </span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-tight font-extrabold tracking-tight text-balance lg:col-span-7">
            <RevealLine>{project.title}</RevealLine>
          </h1>
          {project.summary && (
            <p className="text-base leading-relaxed text-ink-muted sm:text-lg lg:col-span-5">{project.summary}</p>
          )}
        </div>
      </header>

      <Reveal className="mx-auto mt-12 max-w-content px-4 sm:px-6">
        <div
          className="aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-band shadow-card"
          style={{ viewTransitionName: `project-cover-${project.slug}` }}
        >
          {project.cover ? (
            <ResponsiveImage
              media={project.cover}
              priority
              sizes="(min-width: 1200px) 1152px, 100vw"
              className="h-full w-full object-cover"
            />
          ) : (
            <ProjectArtwork slug={project.slug} title={project.title} className="h-full w-full" />
          )}
        </div>
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-content gap-14 px-4 sm:px-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <dl className="grid gap-6 rounded-card bg-surface-raised p-6 shadow-card sm:grid-cols-2 lg:sticky lg:top-24 lg:grid-cols-1">
            {period && <Meta label={t.project.period}>{period}</Meta>}
            {project.project_status && (
              <Meta label={t.project.status}>{t.projects.status[project.project_status]}</Meta>
            )}
            {project.category && <Meta label={t.project.category}>{project.category.name}</Meta>}
            {project.technologies.length > 0 && (
              <Meta label={t.project.technologies}>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {project.technologies.map((technology) => (
                    <li key={technology.slug} className="rounded-pill bg-ink/5 px-2.5 py-1 text-xs font-medium">
                      {technology.name}
                    </li>
                  ))}
                </ul>
              </Meta>
            )}
            {links.length > 0 && (
              <Meta label={t.project.links}>
                <ul className="mt-1 grid gap-1">
                  {links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1 font-medium text-accent-ink hover:underline"
                      >
                        {link.label}
                        <span className="font-mono text-xs text-ink-muted">{hostnameOf(link.href)}</span>
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </Meta>
            )}
          </dl>
        </aside>

        <div className="space-y-14 lg:col-span-8">
          {narrative.map((block) => (
            <Reveal key={block.key} as="section">
              <h2 className="font-display text-2xl font-bold tracking-tight">{block.title}</h2>
              <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-muted">
                {block.content!.split(/\n{2,}/).map((paragraph, p) => (
                  <p key={p}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          ))}

          {project.features.length > 0 && (
            <Reveal as="section">
              <h2 className="font-display text-2xl font-bold tracking-tight">{t.project.features}</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.features.map((feature) => (
                  <li key={feature} className="flex gap-3 rounded-xl border border-line bg-surface-raised p-4">
                    <span aria-hidden="true" className="mt-2 size-2 shrink-0 rotate-45 bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </div>

      {project.gallery.length > 0 && (
        <section aria-labelledby="gallery-title" className="mx-auto mt-20 max-w-content px-4 sm:px-6">
          <h2 id="gallery-title" className="font-display text-2xl font-bold tracking-tight">
            {t.project.gallery}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {project.gallery.map((item, i) => (
              <Reveal as="li" key={item.media.url} delay={(i % 2) * 0.06}>
                <figure>
                  <div className="overflow-hidden rounded-card bg-ink/5">
                    <ResponsiveImage
                      media={item.media}
                      alt={
                        item.media.alt ??
                        interpolate(t.project.galleryImage, { index: i + 1, total: project.gallery.length })
                      }
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="h-auto w-full"
                    />
                  </div>
                  {item.caption && <figcaption className="mt-3 text-sm text-ink-muted">{item.caption}</figcaption>}
                </figure>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {!preview && <ProjectCta />}
    </article>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

function ProjectCta() {
  const { locale, t } = useLocale()

  return (
    <Reveal className="mx-auto mt-24 max-w-content px-4 sm:px-6">
      <div className="grid gap-6 rounded-[1.75rem] bg-band p-8 text-band-ink sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-display text-2xl font-bold sm:text-3xl">{t.project.ctaTitle}</p>
          <p className="mt-2 text-band-muted">{t.project.ctaBody}</p>
        </div>
        <Link to={paths.section(locale, 'contact')} className={buttonStyles.primary}>
          {t.project.ctaButton}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Reveal>
  )
}
