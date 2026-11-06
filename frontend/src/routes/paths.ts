import type { SectionKey } from '../lib/api/types'
import { localizedPath, type Locale } from '../i18n/locales'

/**
 * Segmentos de URL por idioma. Têm de coincidir com `public_paths` em backend/config/portfolio.php
 * (usado para gerar o sitemap).
 */
const segments: Record<Locale, { projects: string }> = {
  pt: { projects: 'projectos' },
  en: { projects: 'projects' },
}

/** Âncoras das secções da página inicial, legíveis em cada idioma. */
export const sectionIds: Record<Locale, Record<SectionKey | 'top', string>> = {
  pt: {
    top: 'inicio',
    about: 'sobre',
    skills: 'competencias',
    projects: 'projectos',
    services: 'servicos',
    process: 'metodologia',
    journey: 'percurso',
    testimonials: 'testemunhos',
    contact: 'contacto',
  },
  en: {
    top: 'top',
    about: 'about',
    skills: 'skills',
    projects: 'projects',
    services: 'services',
    process: 'process',
    journey: 'journey',
    testimonials: 'testimonials',
    contact: 'contact',
  },
}

export const paths = {
  home: (locale: Locale) => localizedPath(locale),
  section: (locale: Locale, section: SectionKey | 'top') => `${localizedPath(locale)}#${sectionIds[locale][section]}`,
  projects: (locale: Locale) => localizedPath(locale, segments[locale].projects),
  project: (locale: Locale, slug: string) =>
    localizedPath(locale, `${segments[locale].projects}/${encodeURIComponent(slug)}`),
  projectsSegment: (locale: Locale) => segments[locale].projects,
}

/** Caminho equivalente noutro idioma (para o selector de idioma manter a página actual). */
export function translatePath(pathname: string, from: Locale, to: Locale): string {
  const fromHome = localizedPath(from)
  const rest = fromHome === '/' ? pathname : pathname.slice(fromHome.length) || '/'
  const parts = rest.split('/').filter(Boolean)

  if (parts[0] === segments[from].projects) {
    return parts[1] ? paths.project(to, decodeURIComponent(parts[1])) : paths.projects(to)
  }

  return paths.home(to)
}
