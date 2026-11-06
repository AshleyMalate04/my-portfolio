import { useQuery } from '@tanstack/react-query'
import { FileText, LoaderCircle, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import type { MediaRef } from '../types'
import { Dialog } from '../ui/Dialog'
import { EmptyState, ErrorBlock, LoadingBlock, Pagination, SearchInput } from '../ui/Page'
import { adminButton } from '../ui/styles'
import { useUpload } from './useUpload'
import { ACCEPT } from './utils'

interface MediaPickerProps {
  open: boolean
  kind: 'image' | 'document'
  title?: string
  onClose: () => void
  onSelect: (media: MediaRef) => void
}

/** Escolha de um ficheiro da biblioteca (ou carregamento de um novo) para associar a um conteúdo. */
export function MediaPicker({ open, kind, title, onClose, onSelect }: MediaPickerProps) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const media = useQuery({
    queryKey: [...adminKeys.media, 'picker', kind, q, page],
    queryFn: () => adminApi.media({ kind, q: q || undefined, page, per_page: 24 }),
    enabled: open,
  })

  const upload = useUpload((uploaded) => {
    onSelect(uploaded)
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={title ?? (kind === 'image' ? 'Escolher imagem' : 'Escolher documento')}
      description={kind === 'image' ? 'JPEG, PNG, WebP ou AVIF até 5 MB.' : 'PDF até 10 MB.'}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={q}
          onChange={(value) => {
            setQ(value)
            setPage(1)
          }}
          label="Pesquisar por nome ou texto alternativo"
        />
        <div>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT[kind]}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload.mutate(file)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className={adminButton.accent}
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="size-4" />
            )}
            Carregar novo
          </button>
        </div>
      </div>

      {media.isPending ? (
        <LoadingBlock />
      ) : media.isError ? (
        <ErrorBlock message={media.error.message} onRetry={() => void media.refetch()} />
      ) : media.data.data.length === 0 ? (
        <EmptyState title="Ainda não há ficheiros deste tipo">
          Use “Carregar novo” para adicionar o primeiro.
        </EmptyState>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {media.data.data.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item)
                    onClose()
                  }}
                  className="group block w-full overflow-hidden rounded-xl border border-line bg-surface-raised text-left transition-colors hover:border-ink"
                >
                  <MediaThumb media={item} className="aspect-[4/3]" />
                  <span className="block truncate px-2 py-1.5 text-xs">{item.original_name}</span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination meta={media.data.meta} onPage={setPage} />
        </>
      )}
    </Dialog>
  )
}

export function MediaThumb({
  media,
  className = '',
}: {
  media: Pick<MediaRef, 'url' | 'kind' | 'original_name' | 'alt'>
  className?: string
}) {
  if (media.kind === 'document') {
    return (
      <span className={`flex flex-col items-center justify-center gap-1 bg-lavender-300/30 text-plum-950 ${className}`}>
        <FileText aria-hidden="true" className="size-8" />
        <span className="font-mono text-[0.65rem] uppercase">PDF</span>
      </span>
    )
  }

  return (
    <span className={`block overflow-hidden bg-ink/5 ${className}`}>
      <img src={media.url} alt={media.alt?.pt ?? ''} loading="lazy" className="h-full w-full object-cover" />
    </span>
  )
}
