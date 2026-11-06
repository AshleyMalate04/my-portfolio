import type { BrandSettings } from './brandSettings'

export function BrandMark({ brand, className = 'h-8 w-auto' }: { brand: BrandSettings; className?: string }) {
  if (brand.logo) {
    return (
      <img
        src={brand.logo.url}
        alt={brand.siteName}
        width={brand.logo.width ?? undefined}
        height={brand.logo.height ?? undefined}
        className={className}
      />
    )
  }

  return (
    <>
      {brand.wordmark}
      <span className="text-accent transition-transform duration-base group-hover:translate-x-0.5">.</span>
    </>
  )
}
