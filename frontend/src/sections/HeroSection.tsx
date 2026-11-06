import { ArrowDownRight } from 'lucide-react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Bubbles } from '../components/motion/Bubbles'
import { FleeingMarks } from '../components/motion/FleeingMarks'
import { FloatingField } from '../components/motion/FloatingField'
import { Magnetic } from '../components/motion/Magnetic'
import { Parallax } from '../components/motion/Parallax'
import { SectionGrid } from '../components/motion/SectionGrid'
import { KineticText } from '../components/motion/KineticText'
import { RevealLine } from '../components/motion/Reveal'
import { TypewriterText } from '../components/motion/TypewriterText'
import { InitialsPortrait } from '../components/ui/InitialsPortrait'
import { ResponsiveImage } from '../components/ui/ResponsiveImage'
import { buttonStyles } from '../components/ui/styles'
import { motionDuration, motionEase } from '../components/motion/config'
import { useLocale } from '../i18n/context'
import { initialsOf } from '../lib/format'
import type { Profile } from '../lib/api/types'
import { paths, sectionIds } from '../routes/paths'

interface HeroSectionProps {
  profile: Profile
  hasProjects: boolean
  showContact: boolean
}

const availabilityTone = {
  available: {
    pill: 'border-success/50 bg-success/15 text-success',
    dot: 'bg-success',
  },
  open_to_opportunities: {
    pill: 'border-accent/50 bg-accent/15 text-accent-ink',
    dot: 'bg-accent',
  },
  unavailable: {
    pill: 'border-ink/25 bg-ink/5 text-ink-muted',
    dot: 'bg-mauve-500',
  },
} as const

export function HeroSection({ profile, hasProjects, showContact }: HeroSectionProps) {
  const { locale, t } = useLocale()
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const heroRef = useRef<HTMLElement>(null)
  // 0 com o hero no sítio (logo abaixo do cabeçalho de 4,5rem); 1 quando o hero sai pelo topo.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start 72px', 'end start'],
  })
  // Só o texto desaparece primeiro; a camada escura sai logo a seguir e deixa a fotografia limpa.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.24], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.24], [0, -48])
  const imageOverlayOpacity = useTransform(scrollYProgress, [0.06, 0.4], [1, 0])
  const animated = !reduce && isMobile
  const [firstName = profile.full_name, ...rest] = profile.full_name.split(' ')
  const phrases = profile.hero_phrases.filter(Boolean)
  const valuePhrase = phrases[0]
  const rotating = phrases.length > 1 ? phrases : []
  const portrait = profile.hero_image ?? profile.photo

  const fadeUp = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 32 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: motionDuration.slow, ease: motionEase, delay },
        }

  return (
    <section
      ref={heroRef}
      id={sectionIds[locale].top}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col justify-end overflow-hidden bg-surface pt-2 pb-10 lg:block lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-visible"
    >
      {/* Ecrãs estreitos: a fotografia é o fundo do hero, com o texto por cima de uma camada escura.
          Ao fazer scroll o texto e a camada desvanecem e a fotografia fica limpa.
          A altura do hero não aumenta: a fotografia fica parada no ecrã (position: fixed) e a secção,
          cortada por clip-path, passa por cima como uma janela — por isso o rosto continua à vista. */}
      <div
        aria-hidden="true"
        className="hero-mobile-portrait absolute inset-0 z-0 overflow-hidden lg:hidden"
        style={animated ? { clipPath: 'inset(0)' } : undefined}
      >
        <div className={animated ? 'fixed top-0 left-0 h-[100svh] w-full' : 'absolute inset-0'}>
          {portrait ? (
            <ResponsiveImage
              media={portrait}
              alt=""
              priority
              sizes="100vw"
              className="h-full w-full object-cover object-[50%_25%]"
            />
          ) : (
            <InitialsPortrait initials={initialsOf(profile.full_name)} label={t.hero.portraitInitials} fill />
          )}
        </div>
        <m.div
          className="hero-mobile-portrait-overlay absolute inset-0"
          style={animated ? { opacity: imageOverlayOpacity } : undefined}
        />
      </div>
      <SectionGrid />
      <FloatingField tone="hero" />
      <Bubbles count={14} seed={7} />
      <FleeingMarks />

      <m.div
        className="hero-content relative z-10 mx-auto grid w-full max-w-content gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-end lg:gap-8"
        style={animated ? { opacity: contentOpacity, y: contentY } : undefined}
      >
        <div className="lg:col-span-7">
          {profile.availability && (
            <m.div {...fadeUp(0)} className="mb-8">
              <span
                className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1 text-xs font-semibold ${availabilityTone[profile.availability.status].pill}`}
              >
                <span className="relative flex size-2.5" aria-hidden="true">
                  {profile.availability.status !== 'unavailable' && (
                    <span
                      className={`absolute inline-flex size-full animate-ping rounded-full opacity-70 motion-reduce:hidden ${availabilityTone[profile.availability.status].dot}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex size-2.5 rounded-full ring-2 ring-current/20 ${availabilityTone[profile.availability.status].dot}`}
                  />
                </span>
                {profile.availability.note ?? t.hero.availability[profile.availability.status]}
              </span>
            </m.div>
          )}

          <h1 id="hero-title" className="font-display leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
            <span className="block text-[clamp(2.75rem,5.6vw,4.5rem)]">
              <KineticText text={firstName} />
              <span className="text-accent">.</span>
            </span>
            {rest.length > 0 && (
              <RevealLine
                delay={0.12}
                className="mt-2 text-[clamp(1.25rem,2.4vw,1.75rem)] tracking-tight text-ink-muted"
              >
                {rest.join(' ')}
              </RevealLine>
            )}
          </h1>

          {profile.headline && (
            <m.p {...fadeUp(0.25)} className="mt-6 font-display text-base font-semibold text-accent-ink sm:text-lg">
              <TypewriterText phrases={[profile.headline]} />
            </m.p>
          )}

          {rotating.length > 0 ? (
            <m.p
              {...fadeUp(0.32)}
              className="mt-5 max-w-3xl font-display text-xl leading-snug font-semibold sm:text-2xl"
            >
              <span className="bg-[linear-gradient(transparent_62%,var(--color-highlight)_62%)] box-decoration-clone">
                <TypewriterText phrases={rotating} />
              </span>
            </m.p>
          ) : (
            valuePhrase && (
              <m.p
                {...fadeUp(0.32)}
                className="mt-5 max-w-3xl font-display text-xl leading-snug font-semibold sm:text-2xl"
              >
                <span className="bg-[linear-gradient(transparent_62%,var(--color-highlight)_62%)] box-decoration-clone">
                  {valuePhrase}
                </span>
              </m.p>
            )
          )}

          {profile.short_bio && (
            <m.p {...fadeUp(0.4)} className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              {profile.short_bio}
            </m.p>
          )}

          <m.div {...fadeUp(0.48)} className="mt-10 flex flex-wrap gap-3">
            {hasProjects && (
              <Magnetic>
                <Link to={paths.section(locale, 'projects')} className={buttonStyles.dark}>
                  {t.hero.exploreProjects}
                  <ArrowDownRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
                  />
                </Link>
              </Magnetic>
            )}
            {showContact && (
              <Magnetic>
                <Link to={paths.section(locale, 'contact')} className={buttonStyles.primary}>
                  {t.hero.contactMe}
                </Link>
              </Magnetic>
            )}
          </m.div>
        </div>

        <m.div
          className="relative mx-auto hidden w-full max-w-[17rem] sm:max-w-[20rem] lg:col-span-5 lg:block lg:max-w-[24rem]"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, clipPath: 'inset(14% 10% 10% 10% round 2rem)', scale: 1.06 },
                animate: { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 2rem)', scale: 1 },
                transition: { duration: motionDuration.hero, ease: motionEase, delay: 0.18 },
              })}
        >
          <Parallax strength={7} className="absolute inset-0 -z-10 scale-95">
            <div
              aria-hidden="true"
              className="h-full w-full bg-support/70 [clip-path:polygon(50%_0%,100%_34%,84%_100%,16%_94%,0%_34%)]"
            />
          </Parallax>
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="portrait-frame pointer-events-none absolute -inset-4 z-10 h-[calc(100%+2rem)] w-[calc(100%+2rem)] overflow-visible"
          >
            <path className="portrait-frame-line portrait-frame-line-a" d="M2 34 L50 1 L98 34" />
            <path className="portrait-frame-line portrait-frame-line-b" d="M98 34 L84 99 L57 97" />
            <path className="portrait-frame-line portrait-frame-line-c" d="M43 96 L16 94 L2 34" />
          </svg>
          <div className="portrait-shape aspect-[4/5] overflow-hidden shadow-card">
            {portrait ? (
              <ResponsiveImage
                media={portrait}
                priority
                alt={portrait.alt ?? profile.full_name}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <InitialsPortrait initials={initialsOf(profile.full_name)} label={t.hero.portraitInitials} />
            )}
          </div>
        </m.div>
      </m.div>
    </section>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isMobile
}
