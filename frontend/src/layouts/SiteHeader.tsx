import { Globe, Menu, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { buttonStyles } from '../components/ui/styles'
import { useLocale } from '../i18n/context'
import { ThemeSwitcher } from '../theme/ThemeSwitcher'
import { BrandMark } from './Brand'
import type { BrandSettings } from './brandSettings'
import { locales } from '../i18n/locales'
import { paths, translatePath } from '../routes/paths'

export interface NavItem {
  key: string
  label: string
  to: string
}

/** Cabeçalho fixo com navegação principal, selector de idioma e menu acessível em ecrãs pequenos. */
export function SiteHeader({
  items,
  ctaTo,
  ctaLabel,
  brand,
}: {
  items: NavItem[]
  ctaTo: string | null
  ctaLabel?: string | null
  brand: BrandSettings
}) {
  const { locale, t } = useLocale()
  const { pathname } = useLocation()
  // Fecha o menu quando se escolhe um destino.
  const close = () => setOpen(false)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Escape fecha o menu e devolve o foco ao botão.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Com dois idiomas, um único botão leva ao outro: mostra o código do idioma de destino.
  const other = locales[(locales.indexOf(locale) + 1) % locales.length] ?? locale
  const languageLink = (
    <Link
      to={translatePath(pathname, locale, other)}
      onClick={close}
      lang={other}
      hrefLang={other}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold uppercase transition-colors hover:bg-ink/5"
    >
      <Globe aria-hidden="true" className="size-5" />
      <span className="sr-only">{t.languageSwitch[other]}</span>
      <span aria-hidden="true">{other}</span>
    </Link>
  )

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-base ${
        scrolled || open ? 'bg-surface/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to={paths.home(locale)}
          className="group inline-flex min-h-11 items-center font-display text-xl font-extrabold tracking-tight"
        >
          <BrandMark brand={brand} />
          {/* <span className="ml-2 hidden font-mono text-[0.7rem] font-normal tracking-normal text-ink-muted sm:inline">
            /dev
          </span> */}
        </Link>

        <nav aria-label={t.nav.primary} className="hidden lg:block">
          <ul className="flex items-center gap-1 text-sm">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="link-underline inline-flex min-h-11 items-center rounded-pill px-3 transition-colors hover:bg-ink/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeSwitcher />
          {languageLink}
          {ctaTo && (
            // Contentor próprio: "hidden" no mesmo elemento colidiria com o inline-flex do botão.
            <span className="hidden md:block">
              <Link to={ctaTo} className={`${buttonStyles.primary} min-h-11 px-5 text-sm`}>
                {ctaLabel || t.nav.cta}
              </Link>
            </span>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-pill border border-ink/15 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? t.nav.closeMenu : t.nav.openMenu}</span>
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      <div id={menuId} hidden={!open} className="border-t border-line bg-surface lg:hidden">
        <nav aria-label={t.nav.primary} className="mx-auto max-w-content px-4 py-6 sm:px-6">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  onClick={close}
                  className="flex min-h-12 items-center rounded-card px-3 font-display text-2xl font-bold hover:bg-ink/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-6">
            {ctaTo && (
              <Link to={ctaTo} onClick={close} className={buttonStyles.primary}>
                {ctaLabel || t.nav.cta}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
