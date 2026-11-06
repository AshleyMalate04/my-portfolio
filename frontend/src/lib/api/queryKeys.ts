import type { Locale } from '../../i18n/locales'
import type { ProjectFilters } from './public'

/** Chaves de cache do TanStack Query, centralizadas para invalidações consistentes. */
export const queryKeys = {
  home: (locale: Locale) => ['home', locale] as const,
  projects: (locale: Locale, filters: ProjectFilters = {}) => ['projects', locale, filters] as const,
  projectCategories: (locale: Locale) => ['project-categories', locale] as const,
  technologies: (locale: Locale) => ['technologies', locale] as const,
  project: (locale: Locale, slug: string) => ['project', locale, slug] as const,
  adminSession: ['admin', 'session'] as const,
}
