import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { PageTransition } from '../components/motion/Reveal'
import { ScrollProgress } from '../components/motion/ScrollProgress'
import { useHomeData, visibleSections } from '../hooks/useHomeData'
import { useScrollManagement } from '../hooks/useScrollManagement'
import { useLocale } from '../i18n/context'
import { LocaleProvider } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/locales'
import { paths } from '../routes/paths'
import { brandFrom } from './brandSettings'
import { SiteHeader, type NavItem } from './SiteHeader'

const MAIN_ID = 'conteudo'

/** Estrutura do site público: cabeçalho e conteúdo da rota, no idioma da rota (sem rodapé: a página termina no contacto). */
export function PublicLayout({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <PublicShell />
    </LocaleProvider>
  )
}

function PublicShell() {
  const { locale, t } = useLocale()
  const { pathname } = useLocation()
  const home = useHomeData()
  const visible = visibleSections(home.data)
  const settings = home.data?.settings
  const brand = brandFrom(settings)
  const faviconUrl = settings?.favicon?.url

  // Favicon configurado no backoffice (substitui o favicon.svg por omissão).
  useEffect(() => {
    if (!faviconUrl) return
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    const previous = { href: link.href, type: link.type }
    link.href = faviconUrl
    link.removeAttribute('type')
    return () => {
      link.href = previous.href
      link.type = previous.type
    }
  }, [faviconUrl])

  useScrollManagement(MAIN_ID)

  // A navegação só lista secções com conteúdo publicado.
  const items: NavItem[] = [
    { key: 'about', label: t.nav.about, to: paths.section(locale, 'about') },
    { key: 'skills', label: t.nav.skills, to: paths.section(locale, 'skills') },
    { key: 'projects', label: t.nav.projects, to: paths.projects(locale) },
    { key: 'services', label: t.nav.services, to: paths.section(locale, 'services') },
    // Percurso oculto por agora (a secção está comentada em pages/public/HomePage.tsx).
    // { key: 'journey', label: t.nav.journey, to: paths.section(locale, 'journey') },
    { key: 'contact', label: t.nav.contact, to: paths.section(locale, 'contact') },
  ].filter((item) => !home.data || visible[item.key as keyof typeof visible])

  const ctaTo = visible.contact ? paths.section(locale, 'contact') : null

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only z-50 rounded-pill bg-ink px-4 py-2 text-ink-inverse focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        {t.skipToContent}
      </a>

      <ScrollProgress />
      <SiteHeader items={items} ctaTo={ctaTo} ctaLabel={settings?.primary_cta_label} brand={brand} />

      <main id={MAIN_ID} tabIndex={-1} className="flex-1 overflow-x-clip outline-none">
        <PageTransition id={pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
