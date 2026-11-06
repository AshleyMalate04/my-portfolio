import { ArrowUpRight, Briefcase, CodeXml, Download, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { Bubbles } from '../../components/motion/Bubbles'
import { FleeingMarks } from '../../components/motion/FleeingMarks'
import { Reveal, RevealLine } from '../../components/motion/Reveal'
import { SectionGrid } from '../../components/motion/SectionGrid'
import { useLocale } from '../../i18n/context'
import type { Messages } from '../../i18n/messages'
import { isSafeUrl, whatsappUrl } from '../../lib/format'
import type { Profile, SiteSettings, SocialLink } from '../../lib/api/types'
import { sectionIds } from '../../routes/paths'

interface ContactSectionProps {
  profile: Profile | null
  socialLinks: SocialLink[]
  settings: SiteSettings
}

interface Channel {
  key: string
  label: string
  value: string
  href: string
  icon: ReactNode
  external: boolean
}

const order = ['whatsapp', 'linkedin', 'github', 'email', 'phone']

/** Endereço legível: sem protocolo, "www.", parâmetros nem barra final (ex.: linkedin.com/in/nome). */
function handleOf(url: string): string {
  return url
    .replace(/^(https?:\/\/|mailto:)/, '')
    .replace(/^www\./, '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '')
}

function iconFor(platform: string): ReactNode {
  const props = { className: 'size-5', 'aria-hidden': true } as const
  switch (platform) {
    case 'whatsapp':
      return <MessageCircle {...props} />
    case 'linkedin':
      return <Briefcase {...props} />
    case 'github':
      return <CodeXml {...props} />
    case 'email':
      return <Mail {...props} />
    case 'phone':
      return <Phone {...props} />
    default:
      return <Globe {...props} />
  }
}

/** Junta os contactos do perfil e as redes sociais publicadas, sem duplicar plataformas. */
function buildChannels(profile: Profile | null, socialLinks: SocialLink[], t: Messages['contact']): Channel[] {
  const channels: Channel[] = []
  const add = (key: string, label: string, value: string, href: string, external: boolean) => {
    if (!channels.some((channel) => channel.key === key) && isSafeUrl(href)) {
      channels.push({ key, label, value, href, icon: iconFor(key), external })
    }
  }

  const whatsapp = profile?.whatsapp ? whatsappUrl(profile.whatsapp) : null
  if (profile?.whatsapp && whatsapp) add('whatsapp', t.whatsapp, profile.whatsapp, whatsapp, true)
  if (profile?.public_email) add('email', t.email, profile.public_email, `mailto:${profile.public_email}`, false)
  if (profile?.phone) add('phone', t.phone, profile.phone, `tel:${profile.phone.replace(/\s/g, '')}`, false)

  const known: Record<string, string> = {
    whatsapp: t.whatsapp,
    linkedin: t.linkedin,
    github: t.github,
    email: t.email,
    website: t.website,
  }
  for (const link of socialLinks) {
    const key = known[link.platform] ? link.platform : `${link.platform}-${link.url}`
    add(
      key,
      link.label ?? known[link.platform] ?? link.platform,
      handleOf(link.url),
      link.url,
      !link.url.startsWith('mailto:'),
    )
  }

  const rank = (key: string) => (order.indexOf(key) === -1 ? order.length : order.indexOf(key))
  return channels.sort((a, b) => rank(a.key) - rank(b.key))
}

/**
 * Última secção do site: uma frase em destaque e, logo a seguir, os canais directos
 * (WhatsApp, LinkedIn, GitHub, email…) e o CV.
 */
export function ContactSection({ profile, socialLinks, settings }: ContactSectionProps) {
  const { locale, t } = useLocale()
  const channels = buildChannels(profile, socialLinks, t.contact)
  const headline = settings.contact_headline || t.contact.headlineFallback
  const cvUrl = isSafeUrl(profile?.cv_url) ? profile.cv_url : null

  return (
    <section
      id={sectionIds[locale].contact}
      aria-labelledby="contact-title"
      className="relative isolate scroll-mt-20 overflow-hidden bg-band py-16 text-band-ink sm:py-24"
    >
      <SectionGrid tone="band" />
      <div
        aria-hidden="true"
        className="absolute -top-48 -right-40 -z-10 size-[28rem] rounded-full bg-accent/15 blur-3xl"
      />
      <FleeingMarks />
      <Bubbles count={12} seed={21} />

      <div className="mx-auto w-full max-w-content px-4 sm:px-6">
        <span aria-hidden="true" className="mb-5 block h-1 w-12 rounded-full bg-accent" />
        <h2
          id="contact-title"
          className="font-display text-[clamp(2.1rem,5vw,3.75rem)] leading-tight font-extrabold tracking-tight text-balance"
        >
          <RevealLine>{headline}</RevealLine>
        </h2>

        {(channels.length > 0 || cvUrl) && (
          <Reveal className="mt-10 sm:mt-12">
            <h3 className="sr-only">{t.contact.channels}</h3>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {channels.map((channel) => (
                <li key={channel.key}>
                  <a
                    href={channel.href}
                    {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex h-full min-h-20 items-center gap-4 rounded-card border border-band-line bg-band-ink/5 px-5 py-4 transition-[transform,background-color,border-color,color] duration-base hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-plum-950"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-band-ink/10 transition-colors group-hover:bg-plum-950 group-hover:text-ivory-50">
                      {channel.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg leading-tight font-bold">{channel.label}</span>
                      <span className="block truncate text-sm text-band-muted group-hover:text-plum-950/70">
                        {channel.value}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </a>
                </li>
              ))}

              {cvUrl && (
                <li className={channels.length % 4 === 0 ? 'sm:col-span-2 lg:col-span-4' : ''}>
                  <a
                    href={cvUrl}
                    download
                    className="group flex h-full min-h-20 items-center gap-4 rounded-card bg-butter-300 px-5 py-4 text-plum-950 transition-transform duration-base hover:-translate-y-0.5"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-plum-950 text-butter-300">
                      <Download aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg leading-tight font-bold">{t.contact.cv}</span>
                      <span className="block text-sm text-plum-950/70">{t.contact.cvHint}</span>
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        )}

        {channels.length === 0 && !cvUrl && <p className="mt-10 text-band-muted">{t.contact.noChannels}</p>}

        {profile?.location && (
          <p className="mt-10 inline-flex items-center gap-2 text-sm text-band-muted">
            <MapPin aria-hidden="true" className="size-4" />
            <span className="sr-only">{t.contact.location}: </span>
            {profile.location}
          </p>
        )}
      </div>
    </section>
  )
}
