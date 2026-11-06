import { useEffect } from 'react'
import { env } from '../../config/env'
import { htmlLang, locales, type Locale } from '../../i18n/locales'

export interface SeoOptions {
  title: string
  description?: string | null
  locale: Locale
  /** Caminho desta página em cada idioma (canonical + hreflang). */
  alternates: Record<Locale, string>
  image?: string | null
  type?: 'website' | 'article' | 'profile'
  /** Dados estruturados schema.org (JSON-LD). */
  jsonLd?: Record<string, unknown> | null
  noindex?: boolean
}

const MANAGED = 'data-seo'

function absolute(path: string): string {
  const origin = env.siteUrl || window.location.origin
  return new URL(path, origin).toString()
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string | null | undefined) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)

  if (!content) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.content = content
}

/**
 * Actualiza título, descrição, canonical, hreflang, Open Graph e JSON-LD da página actual.
 *
 * Nota: num SPA estes metadados só existem depois de o JavaScript correr. O Google executa-o,
 * mas pré-visualizações de redes sociais e outros motores normalmente não — ver docs/architecture.md.
 */
export function useSeo({
  title,
  description,
  locale,
  alternates,
  image,
  type = 'website',
  jsonLd,
  noindex,
}: SeoOptions) {
  const serializedLd = jsonLd ? JSON.stringify(jsonLd) : null
  const alternatesKey = JSON.stringify(alternates)

  useEffect(() => {
    // Reconstruído a partir da forma serializada para o efeito depender de um valor estável.
    const paths = JSON.parse(alternatesKey) as Record<Locale, string>
    const canonical = absolute(paths[locale])
    document.title = title

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:locale', htmlLang[locale].replace('-', '_'))
    upsertMeta('property', 'og:image', image ? absolute(image) : null)
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')

    document.head.querySelectorAll(`[${MANAGED}]`).forEach((element) => element.remove())

    const links: { rel: string; href: string; hreflang?: string }[] = [
      { rel: 'canonical', href: canonical },
      ...locales.map((code) => ({ rel: 'alternate', href: absolute(paths[code]), hreflang: htmlLang[code] })),
      { rel: 'alternate', href: absolute(paths.pt), hreflang: 'x-default' },
    ]

    for (const { rel, href, hreflang } of links) {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      if (hreflang) link.hreflang = hreflang
      link.setAttribute(MANAGED, '')
      document.head.appendChild(link)
    }

    if (serializedLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = serializedLd
      script.setAttribute(MANAGED, '')
      document.head.appendChild(script)
    }
  }, [title, description, locale, alternatesKey, image, type, serializedLd, noindex])
}
