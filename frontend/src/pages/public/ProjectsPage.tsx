import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useId } from 'react'
import { Link, useSearchParams } from 'react-router'
import { RevealLine } from '../../components/motion/Reveal'
import { FilterChips } from '../../components/projects/FilterChips'
import { QueryState } from '../../components/QueryState'
import { useSeo } from '../../components/seo/useSeo'
import { buttonStyles } from '../../components/ui/styles'
import { useLocale } from '../../i18n/context'
import { locales, type Locale } from '../../i18n/locales'
import { interpolate } from '../../i18n/messages'
import { publicApi, type ProjectFilters } from '../../lib/api/public'
import { queryKeys } from '../../lib/api/queryKeys'
import { paths } from '../../routes/paths'
import { ProjectGrid } from '../../sections/ProjectsSection'

const PER_PAGE = 9

/** Lista completa de projectos publicados. Filtros e página ficam na URL (partilháveis e indexáveis). */
export function ProjectsPage() {
  const { locale, t } = useLocale()
  const [params, setParams] = useSearchParams()
  const selectId = useId()

  const filters: ProjectFilters = {
    category: params.get('categoria') ?? undefined,
    technology: params.get('tecnologia') ?? undefined,
    page: Number(params.get('pagina')) > 1 ? Number(params.get('pagina')) : undefined,
    per_page: PER_PAGE,
  }

  const projects = useQuery({
    queryKey: queryKeys.projects(locale, filters),
    queryFn: () => publicApi.projects(locale, filters),
    placeholderData: keepPreviousData,
  })
  const categories = useQuery({
    queryKey: queryKeys.projectCategories(locale),
    queryFn: () => publicApi.projectCategories(locale),
  })
  const technologies = useQuery({
    queryKey: queryKeys.technologies(locale),
    queryFn: () => publicApi.technologies(locale),
  })

  useSeo({
    title: `${t.projects.pageTitle} — Ashley da Amena Mario Malate`,
    description: t.seo.projectsDescription,
    locale,
    alternates: Object.fromEntries(locales.map((code) => [code, paths.projects(code)])) as Record<Locale, string>,
  })

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('pagina' in changes)) next.delete('pagina')
    setParams(next)
  }

  const hasFilters = Boolean(filters.category || filters.technology)

  return (
    <>
      <div className="border-b border-line bg-surface-alt">
        <div className="mx-auto max-w-content px-4 pt-10 pb-8 sm:px-6 sm:pt-14">
          <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-accent" />
          <header className="mb-8 grid gap-4 lg:grid-cols-12 lg:items-end">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-tight font-extrabold tracking-tight lg:col-span-8">
              <RevealLine>
                {t.projects.pageTitle}
                <span className="text-accent">.</span>
              </RevealLine>
            </h1>
            <p className="text-base text-ink-muted sm:text-lg lg:col-span-5 lg:col-start-8">{t.projects.pageIntro}</p>
          </header>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {categories.data && categories.data.length > 1 ? (
              <FilterChips
                label={t.projects.filterCategory}
                allLabel={t.projects.allCategories}
                value={filters.category}
                onChange={(value) => update({ categoria: value })}
                options={categories.data.map((c) => ({ value: c.slug, label: c.name, count: c.projects_count }))}
              />
            ) : (
              <span />
            )}

            {technologies.data && technologies.data.length > 1 && (
              <div className="flex items-center gap-3">
                <label htmlFor={selectId} className="text-sm text-ink-muted">
                  {t.projects.filterTechnology}
                </label>
                <select
                  id={selectId}
                  value={filters.technology ?? ''}
                  onChange={(event) => update({ tecnologia: event.target.value || undefined })}
                  className="min-h-11 rounded-pill border border-ink/20 bg-surface-raised px-4 text-sm"
                >
                  <option value="">{t.projects.allTechnologies}</option>
                  {technologies.data.map((technology) => (
                    <option key={technology.slug} value={technology.slug}>
                      {technology.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-content px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
        <QueryState query={projects}>
          {(page) =>
            page.data.length === 0 ? (
              <div className="rounded-card border border-dashed border-ink/25 p-10 text-center">
                <p className="text-lg text-ink-muted">{hasFilters ? t.projects.emptyFiltered : t.projects.empty}</p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => setParams(new URLSearchParams())}
                    className={`${buttonStyles.outline} mt-6`}
                  >
                    {t.projects.clearFilters}
                  </button>
                )}
              </div>
            ) : (
              <div aria-busy={projects.isFetching}>
                <p className="mb-8 text-sm text-ink-muted" role="status">
                  {interpolate(t.projects.results, { count: page.meta.total })}
                </p>
                <ProjectGrid projects={page.data} headingLevel="h2" />

                {page.meta.last_page > 1 && (
                  <nav
                    aria-label={t.projects.pagination}
                    className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-8"
                  >
                    <PageLink
                      disabled={page.meta.current_page <= 1}
                      onClick={() => update({ pagina: String(page.meta.current_page - 1) })}
                      label={t.projects.previous}
                      icon="prev"
                    />
                    <span className="text-sm text-ink-muted">
                      {interpolate(t.projects.pageOf, { page: page.meta.current_page, total: page.meta.last_page })}
                    </span>
                    <PageLink
                      disabled={page.meta.current_page >= page.meta.last_page}
                      onClick={() => update({ pagina: String(page.meta.current_page + 1) })}
                      label={t.projects.next}
                      icon="next"
                    />
                  </nav>
                )}
              </div>
            )
          }
        </QueryState>

        <p className="mt-16">
          <Link
            to={paths.home(locale)}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t.notFound.back}
          </Link>
        </p>
      </div>
    </>
  )
}

function PageLink({
  disabled,
  onClick,
  label,
  icon,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  icon: 'prev' | 'next'
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={buttonStyles.outline}>
      {icon === 'prev' && <ArrowLeft aria-hidden="true" className="size-4" />}
      {label}
      {icon === 'next' && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )
}
