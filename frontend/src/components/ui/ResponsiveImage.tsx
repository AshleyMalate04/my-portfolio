import type { MediaAsset } from '../../lib/api/types'

interface ResponsiveImageProps {
  media: MediaAsset
  className?: string
  /** Imagens do primeiro ecrã: carregamento imediato e prioridade alta. */
  priority?: boolean
  sizes?: string
  alt?: string
}

/**
 * Imagem com dimensões explícitas (evita deslocações de layout) e lazy loading fora do primeiro ecrã.
 * O backend ainda não gera variantes por tamanho; quando gerar, acrescentar srcset aqui.
 */
export function ResponsiveImage({ media, className, priority = false, sizes, alt }: ResponsiveImageProps) {
  return (
    <img
      src={media.url}
      alt={alt ?? media.alt ?? ''}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes}
      className={className}
    />
  )
}
