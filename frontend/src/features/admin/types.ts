import type { Locale } from '../../i18n/locales'
import type { AvailabilityStatus, ProjectStatus, SectionKey, SocialLink } from '../../lib/api/types'

/** Valor traduzível tal como guardado no backend: {"pt": "...", "en": "..."}. */
export type Translated<T = string> = Partial<Record<Locale, T>> | null

export interface AdminRecord {
  id: number
  created_at?: string | null
  updated_at?: string | null
  [field: string]: unknown
}

export interface AdminMedia {
  id: number
  url: string
  kind: 'image' | 'document'
  original_name: string
  mime_type: string
  extension: string
  size: number
  width: number | null
  height: number | null
  alt: Translated
  usage: { type: string; id: number | null; field: string; label: string }[]
  created_at: string | null
  updated_at: string | null
}

/** Ficheiro tal como vem nas relações (ex.: cover, photo). */
export interface MediaRef {
  id: number
  url: string
  kind: 'image' | 'document'
  original_name: string
  width: number | null
  height: number | null
  alt?: Translated
}

export interface AdminProjectImage {
  id: number
  media_id: number
  caption: Translated
  sort_order: number
  media: MediaRef
}

export interface AdminProject extends AdminRecord {
  slug: string
  title: Translated
  summary: Translated
  description: Translated
  problem: Translated
  objective: Translated
  solution: Translated
  contribution: Translated
  challenges: Translated
  results: Translated
  features: Translated<string[]>
  seo_title: Translated
  seo_description: Translated
  project_category_id: number | null
  project_status: ProjectStatus | null
  publication_status: 'draft' | 'published'
  is_featured: boolean
  sort_order: number
  started_at: string | null
  ended_at: string | null
  demo_url: string | null
  repository_url: string | null
  cover_media_id: number | null
  internal_notes: string | null
  published_at: string | null
  category?: { id: number; name: Translated } | null
  cover?: MediaRef | null
  technology_ids?: number[]
  technologies?: { id: number; name: string; slug: string }[]
  images?: AdminProjectImage[]
}

export interface AdminProfile extends AdminRecord {
  full_name: string
  display_name: string | null
  headline: Translated
  short_bio: Translated
  long_bio: Translated
  hero_phrases: Translated<string[]>
  interests: Translated<string[]>
  approach: Translated
  goals: Translated
  location: string | null
  public_email: string | null
  phone: string | null
  whatsapp: string | null
  availability_status: AvailabilityStatus | null
  availability_note: Translated
  show_availability: boolean
  photo_media_id: number | null
  hero_media_id: number | null
  cv_media_id: number | null
  photo?: MediaRef | null
  hero_image?: MediaRef | null
  cv?: MediaRef | null
}

export interface SettingsPayload {
  values: {
    site_name?: string
    brand_wordmark?: string | null
    site_tagline?: Translated
    seo_title?: Translated
    seo_description?: Translated
    primary_cta_label?: Translated
    contact_headline?: Translated
    logo_media_id?: number | null
    favicon_media_id?: number | null
    og_image_media_id?: number | null
    sections?: Partial<Record<SectionKey, boolean>>
  }
  media: Record<string, MediaRef | null>
}

export interface DashboardSummary {
  projects: { published: number; draft: number }
  skills: { total: number; published: number }
  services: { total: number; published: number }
  testimonials: { pending: number }
  media: { total: number }
  recent_changes: { type: string; id: number; label: string; updated_at: string | null }[]
}

export type SocialPlatform = SocialLink['platform']

export interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PageOf<T> {
  data: T[]
  meta: PageMeta
}
