import { useQuery } from '@tanstack/react-query'
import { useLocale } from '../i18n/context'
import { publicApi } from '../lib/api/public'
import { queryKeys } from '../lib/api/queryKeys'
import type { HomeData, SectionKey } from '../lib/api/types'

/** Conteúdo agregado do site (um pedido, partilhado pela navegação, rodapé e página inicial). */
export function useHomeData() {
  const { locale } = useLocale()
  return useQuery({ queryKey: queryKeys.home(locale), queryFn: () => publicApi.home(locale) })
}

/**
 * Uma secção aparece se estiver activa nas definições e tiver conteúdo real.
 * Assim a navegação nunca aponta para secções vazias.
 */
export function visibleSections(data: HomeData | undefined): Record<SectionKey, boolean> {
  const enabled = (key: SectionKey) => data?.settings.sections?.[key] !== false
  const journey = data?.journey

  return {
    about: enabled('about') && Boolean(data?.profile),
    skills: enabled('skills') && (data?.skills.length ?? 0) > 0,
    projects: enabled('projects') && (data?.projects.total ?? 0) > 0,
    services: enabled('services') && (data?.services.length ?? 0) > 0,
    process: enabled('process') && (data?.process_steps.length ?? 0) > 0,
    journey:
      enabled('journey') &&
      Boolean(journey && journey.education.length + journey.experience.length + journey.certifications.length > 0),
    testimonials: enabled('testimonials') && (data?.testimonials.length ?? 0) > 0,
    contact: enabled('contact'),
  }
}
