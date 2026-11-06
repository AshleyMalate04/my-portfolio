import type { AdminMedia } from './types'

/** Rótulos e utilitários partilhados pelas páginas do backoffice. */

export const projectStatusLabels: Record<string, string> = {
  concept: 'Conceito',
  in_progress: 'Em desenvolvimento',
  completed: 'Concluído',
  maintained: 'Em manutenção',
  paused: 'Pausado',
  archived: 'Arquivado',
}

const usageLabels: Record<string, string> = {
  profile: 'Perfil',
  project: 'Projecto',
  certification: 'Certificação',
  testimonial: 'Testemunho',
  settings: 'Definições',
}

const fieldLabels: Record<string, string> = {
  photo: 'fotografia',
  hero_image: 'imagem do hero',
  cv: 'CV',
  cover: 'capa',
  gallery: 'galeria',
  document: 'certificado',
  author_photo: 'fotografia do autor',
  logo: 'logótipo',
  favicon: 'favicon',
  og_image: 'imagem de partilha',
}

export function describeUsage(usage: AdminMedia['usage'][number]): string {
  const where = usageLabels[usage.type] ?? usage.type
  const field = fieldLabels[usage.field] ?? usage.field
  return usage.type === 'settings' ? `${where} — ${field}` : `${where} “${usage.label}” — ${field}`
}

/** Gera um slug legível a partir do título (sem acentos). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}
