import type { Locale } from '../../i18n/locales'
import { apiRequest } from './client'
import type { DataResponse, HomeData, Paginated, Project, ProjectCategory, ProjectSummary, Technology } from './types'

export type ProjectFilters = {
  category?: string
  technology?: string
  featured?: boolean
  page?: number
  per_page?: number
}

const unwrap = <T>(response: DataResponse<T>): T => response.data

/** Leitura pública: idioma activo e pedido sem sessão (ver RequestOptions.stateless). */
const read = <T>(path: string, locale: Locale, query?: Record<string, string | number | undefined>) =>
  apiRequest<T>(path, { locale, query, stateless: true })

/** Endpoints públicos usados pelo site. Todos recebem o idioma activo para devolver o conteúdo traduzido. */
export const publicApi = {
  home: (locale: Locale) => read<DataResponse<HomeData>>('/home', locale).then(unwrap),
  projects: (locale: Locale, filters: ProjectFilters = {}) =>
    read<Paginated<ProjectSummary>>('/projects', locale, { ...filters, featured: filters.featured ? 1 : undefined }),
  project: (locale: Locale, slug: string) =>
    read<DataResponse<Project>>(`/projects/${encodeURIComponent(slug)}`, locale).then(unwrap),
  projectCategories: (locale: Locale) =>
    read<DataResponse<ProjectCategory[]>>('/project-categories', locale).then(unwrap),
  technologies: (locale: Locale) => read<DataResponse<Technology[]>>('/technologies', locale).then(unwrap),
}
