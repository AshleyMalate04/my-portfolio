export const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp,image/avif',
  document: 'application/pdf',
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
