/** Tipos das respostas da API /api/v1 (ver docs/api.md). */

export interface DataResponse<T> {
  data: T
}

export interface Paginated<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface MediaAsset {
  url: string
  alt: string | null
  mime_type: string
  width: number | null
  height: number | null
}

export type AvailabilityStatus = 'available' | 'open_to_opportunities' | 'unavailable'

export interface Profile {
  full_name: string
  display_name: string
  headline: string | null
  short_bio: string | null
  long_bio: string | null
  hero_phrases: string[]
  interests: string[]
  approach: string | null
  goals: string | null
  location: string | null
  public_email: string | null
  phone: string | null
  whatsapp: string | null
  availability?: { status: AvailabilityStatus; note: string | null }
  photo: MediaAsset | null
  hero_image: MediaAsset | null
  cv_url: string | null
}

/** Ficheiro referenciado nas definições do site (logótipo, favicon, imagem de partilha). */
export interface SettingMedia {
  url: string
  width: number | null
  height: number | null
  mime_type: string
}

export type SectionKey =
  'about' | 'skills' | 'projects' | 'services' | 'process' | 'journey' | 'testimonials' | 'contact'

/** Definições públicas já resolvidas para o idioma pedido. Todas opcionais: o backoffice pode removê-las. */
export interface SiteSettings {
  site_name?: string
  brand_wordmark?: string | null
  site_tagline?: string | null
  seo_title?: string | null
  seo_description?: string | null
  primary_cta_label?: string | null
  contact_headline?: string | null
  logo?: SettingMedia | null
  favicon?: SettingMedia | null
  og_image?: SettingMedia | null
  sections?: Partial<Record<SectionKey, boolean>>
}

export interface SiteInfo {
  locale: string
  available_locales: string[]
  settings: SiteSettings
}

export interface Technology {
  name: string
  slug: string
  website_url: string | null
}

export interface ProjectCategory {
  slug: string
  name: string
  projects_count?: number
}

export type ProjectStatus = 'concept' | 'in_progress' | 'completed' | 'maintained' | 'paused' | 'archived'

export interface ProjectSummary {
  slug: string
  title: string
  summary: string | null
  project_status: ProjectStatus | null
  is_featured: boolean
  started_at: string | null
  ended_at: string | null
  category: ProjectCategory | null
  cover: MediaAsset | null
  technologies: Technology[]
  demo_url: string | null
  repository_url: string | null
}

export interface Project extends ProjectSummary {
  description: string | null
  problem: string | null
  objective: string | null
  solution: string | null
  contribution: string | null
  challenges: string | null
  features: string[]
  results: string | null
  gallery: { caption: string | null; media: MediaAsset }[]
  seo: { title: string | null; description: string | null }
  published_at: string | null
  updated_at: string | null
}

export interface SkillCategory {
  slug: string
  name: string
  description: string | null
  skills: {
    name: string
    description: string | null
    technology: Technology | null
  }[]
}

export interface Education {
  id: number
  institution: string
  institution_short_name: string | null
  degree: string
  field: string | null
  specialization: string | null
  description: string | null
  location: string | null
  started_at: string | null
  ended_at: string | null
  is_current: boolean
}

export interface Experience {
  id: number
  organization: string
  role: string
  employment_type: 'job' | 'internship' | 'freelance' | 'volunteer' | 'academic' | 'other'
  description: string | null
  location: string | null
  started_at: string | null
  ended_at: string | null
  is_current: boolean
}

export interface Certification {
  id: number
  kind: 'course' | 'certification'
  name: string
  issuer: string
  description: string | null
  issued_at: string | null
  expires_at: string | null
  credential_url: string | null
  document_url: string | null
}

export interface Journey {
  education: Education[]
  experience: Experience[]
  certifications: Certification[]
}

export interface Service {
  slug: string
  title: string
  summary: string | null
  description: string | null
  icon: string | null
}

export interface ProcessStep {
  id: number
  title: string
  description: string | null
}

export interface SocialLink {
  platform:
    'linkedin' | 'github' | 'email' | 'whatsapp' | 'instagram' | 'x' | 'behance' | 'dribbble' | 'website' | 'other'
  label: string | null
  url: string
}

export interface Testimonial {
  id: number
  author_name: string
  author_role: string | null
  author_organization: string | null
  quote: string
  author_photo: MediaAsset | null
}

/** Resposta agregada de GET /home. */
export interface HomeData extends SiteInfo {
  profile: Profile | null
  projects: { items: ProjectSummary[]; total: number }
  project_categories: ProjectCategory[]
  skills: SkillCategory[]
  journey: Journey
  services: Service[]
  process_steps: ProcessStep[]
  testimonials: Testimonial[]
  social_links: SocialLink[]
}

export interface AdminUser {
  id: number
  name: string
  email: string
  last_login_at: string | null
}
