import { QueryState } from '../../components/QueryState'
import { useSeo } from '../../components/seo/useSeo'
import { TechMarquee } from '../../components/ui/TechMarquee'
import { visibleSections, useHomeData } from '../../hooks/useHomeData'
import { useLocale } from '../../i18n/context'
import { locales, type Locale } from '../../i18n/locales'
import type { HomeData } from '../../lib/api/types'
import { paths } from '../../routes/paths'
import { AboutSection } from '../../sections/AboutSection'
import { ContactSection } from '../../sections/contact/ContactSection'
import { HeroSection } from '../../sections/HeroSection'
// import { JourneySection } from '../../sections/JourneySection' // Percurso oculto por agora
import { ProcessSection } from '../../sections/ProcessSection'
import { ProjectsSection } from '../../sections/ProjectsSection'
import { ServicesSection } from '../../sections/ServicesSection'
import { SkillsSection } from '../../sections/SkillsSection'
import { TestimonialsSection } from '../../sections/TestimonialsSection'

export function HomePage() {
  const home = useHomeData()

  return (
    <QueryState query={home} loading={<HomeSkeleton />}>
      {(data) => <HomeContent data={data} />}
    </QueryState>
  )
}

function HomeContent({ data }: { data: HomeData }) {
  const { locale } = useLocale()
  const visible = visibleSections(data)
  const { profile, settings } = data

  useSeo({
    title: settings.seo_title ?? profile?.full_name ?? 'Portfólio',
    description: settings.seo_description ?? profile?.short_bio,
    locale,
    alternates: Object.fromEntries(locales.map((code) => [code, paths.home(code)])) as Record<Locale, string>,
    image: settings.og_image?.url ?? profile?.photo?.url,
    type: 'profile',
    jsonLd: profile
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.full_name,
          jobTitle: profile.headline ?? undefined,
          description: profile.short_bio ?? undefined,
          image: profile.photo?.url,
          email: profile.public_email ? `mailto:${profile.public_email}` : undefined,
          address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
          alumniOf: data.journey.education.map((item) => ({ '@type': 'CollegeOrUniversity', name: item.institution })),
          knowsAbout: data.skills.flatMap((category) => category.skills.map((skill) => skill.name)),
          sameAs: data.social_links.map((link) => link.url).filter((url) => url.startsWith('http')),
        }
      : null,
  })

  // Secções de papel alternam o fundo para não se fundirem quando ficam seguidas.
  // Faixas escuras (competências, contacto) já contrastam e não entram nesta conta.
  const paperSections = (['about', 'projects', 'services', 'process', 'testimonials'] as const).filter(
    (key) => visible[key],
  )
  const surface = (key: (typeof paperSections)[number]) =>
    paperSections.indexOf(key) % 2 === 0 ? ('alt' as const) : ('base' as const)

  return (
    <>
      {profile && (
        <HeroSection
          profile={profile}
          hasProjects={visible.projects && data.projects.total > 0}
          showContact={visible.contact}
        />
      )}
      {visible.skills && (
        <TechMarquee items={data.skills.flatMap((category) => category.skills.map((skill) => skill.name))} />
      )}
      {visible.about && profile && (
        <AboutSection profile={profile} education={data.journey.education} surface={surface('about')} />
      )}
      {visible.skills && <SkillsSection categories={data.skills} />}
      {visible.projects && <ProjectsSection data={data} surface={surface('projects')} />}
      {visible.services && (
        <ServicesSection services={data.services} showContact={visible.contact} surface={surface('services')} />
      )}
      {visible.process && <ProcessSection steps={data.process_steps} surface={surface('process')} />}
      {/* Percurso: oculto por agora. Para voltar a mostrar, descomente esta linha e o import no topo
          (e a entrada "journey" do menu em layouts/PublicLayout.tsx).
      {visible.journey && <JourneySection journey={data.journey} surface="alt" />}
      */}
      {visible.testimonials && (
        <TestimonialsSection testimonials={data.testimonials} surface={surface('testimonials')} />
      )}
      {visible.contact && <ContactSection profile={profile} socialLinks={data.social_links} settings={settings} />}
    </>
  )
}

/** Esqueleto com as proporções do hero, para evitar saltos de layout enquanto os dados chegam. */
function HomeSkeleton() {
  const { t } = useLocale()

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto grid max-w-content gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-12"
    >
      <span className="sr-only">{t.states.loading}</span>
      <div aria-hidden="true" className="space-y-6 lg:col-span-7">
        <div className="h-4 w-40 animate-pulse rounded-pill bg-ink/10" />
        <div className="h-32 w-3/4 animate-pulse rounded-card bg-ink/10 sm:h-44" />
        <div className="h-6 w-1/2 animate-pulse rounded-pill bg-ink/10" />
        <div className="h-20 w-full animate-pulse rounded-card bg-ink/5" />
      </div>
      <div aria-hidden="true" className="aspect-[4/5] w-full animate-pulse rounded-[2rem] bg-ink/10 lg:col-span-5" />
    </div>
  )
}
