import type { SiteSettings } from '../lib/api/types'

/** Marca do site: logótipo em imagem (se configurado) ou marca tipográfica definida no backoffice. */
export interface BrandSettings {
  wordmark: string
  logo: SiteSettings['logo']
  siteName: string
}

export function brandFrom(settings: SiteSettings | undefined): BrandSettings {
  return {
    wordmark: settings?.brand_wordmark?.trim() || 'ashley',
    logo: settings?.logo ?? null,
    siteName: settings?.site_name ?? 'Ashley da Amena Mario Malate',
  }
}
