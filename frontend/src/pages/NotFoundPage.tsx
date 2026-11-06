import { ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useSeo } from '../components/seo/useSeo'
import { buttonStyles } from '../components/ui/styles'
import { useLocale } from '../i18n/context'
import { locales, type Locale } from '../i18n/locales'
import { paths } from '../routes/paths'

/** Página 404 (também usada para projectos inexistentes ou não publicados). Não indexável. */
export function NotFoundPage({ title, body }: { title?: string; body?: string }) {
  const { locale, t } = useLocale()
  const { pathname } = useLocation()
  const heading = title ?? t.notFound.title

  useSeo({
    title: heading,
    locale,
    alternates: Object.fromEntries(locales.map((code) => [code, pathname])) as Record<Locale, string>,
    noindex: true,
  })

  return (
    <section className="relative mx-auto max-w-content overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-0 font-display text-[clamp(6rem,20vw,14rem)] leading-none font-extrabold text-lavender-300/40 select-none"
      >
        404
      </p>
      <p className="relative font-mono text-xs tracking-[0.16em] text-accent-ink uppercase">404</p>
      <h1 className="relative mt-4 max-w-2xl font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {heading}
      </h1>
      <p className="relative mt-6 max-w-lg text-lg text-ink-muted">{body ?? t.notFound.body}</p>
      <Link to={paths.home(locale)} className={`${buttonStyles.dark} relative mt-10`}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t.notFound.back}
      </Link>
    </section>
  )
}
