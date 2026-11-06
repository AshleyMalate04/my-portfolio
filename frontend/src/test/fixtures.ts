import type { HomeData, Profile, Project, ProjectSummary } from '../lib/api/types'

/** Dados de teste no formato da API (não são conteúdo real do site). */
export const profileFixture: Profile = {
  full_name: 'Ashley da Amena Mario Malate',
  display_name: 'Ashley da Amena Mario Malate',
  headline: 'Estudante de Informática e desenvolvedora de software',
  short_bio: 'Apresentação curta de teste.',
  long_bio: null,
  hero_phrases: [],
  interests: ['Frontend', 'Bases de dados relacionais'],
  approach: null,
  goals: null,
  location: 'Maputo, Moçambique',
  public_email: null,
  phone: null,
  whatsapp: null,
  photo: null,
  hero_image: null,
  cv_url: null,
}

export const projectSummaryFixture: ProjectSummary = {
  slug: 'sisaep-upm',
  title: 'SISAEP-UPM',
  summary: 'Resumo de teste.',
  project_status: 'in_progress',
  is_featured: false,
  started_at: null,
  ended_at: null,
  category: null,
  cover: null,
  technologies: [{ name: 'Laravel', slug: 'laravel', website_url: null }],
  demo_url: null,
  repository_url: null,
}

export const projectFixture: Project = {
  ...projectSummaryFixture,
  description: null,
  problem: 'Problema de teste.',
  objective: null,
  solution: 'Solução de teste.',
  contribution: null,
  challenges: null,
  features: ['Submissão'],
  results: null,
  gallery: [],
  seo: { title: 'SISAEP-UPM', description: 'Resumo de teste.' },
  published_at: null,
  updated_at: null,
}

export function homeFixture(overrides: Partial<HomeData> = {}): HomeData {
  return {
    locale: 'pt',
    available_locales: ['pt', 'en'],
    settings: { sections: { testimonials: false } },
    profile: profileFixture,
    projects: { items: [], total: 0 },
    project_categories: [],
    skills: [],
    journey: { education: [], experience: [], certifications: [] },
    services: [],
    process_steps: [],
    testimonials: [],
    social_links: [],
    ...overrides,
  }
}
