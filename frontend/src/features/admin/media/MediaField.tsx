import { ExternalLink, ImagePlus, X } from 'lucide-react'
import { useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import type { MediaRef } from '../types'
import { adminButton } from '../ui/styles'
import { MediaPicker, MediaThumb } from './MediaPicker'

interface MediaFieldProps {
  name: string
  label: string
  kind: 'image' | 'document'
  /** Ficheiro actualmente associado (vindo da relação do registo), para a pré-visualização. */
  initial?: MediaRef | null
  help?: string
}

/**
 * Campo de formulário que guarda o id de um ficheiro da biblioteca.
 * Mostra pré-visualização, permite escolher/carregar outro ou retirar a associação
 * (retirar não apaga o ficheiro da biblioteca).
 */
export function MediaField({ name, label, kind, initial, help }: MediaFieldProps) {
  const { field } = useController({ name })
  const {
    formState: { errors },
  } = useFormContext()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<MediaRef | null>(initial ?? null)
  const current = field.value ? (selected?.id === Number(field.value) ? selected : initial) : null
  const error = (errors[name] as { message?: string } | undefined)?.message

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-ink/20 p-3">
        {current ? (
          <MediaThumb media={current} className="size-20 shrink-0 rounded-lg" />
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink-muted">
            <ImagePlus aria-hidden="true" className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{current ? current.original_name : 'Nenhum ficheiro seleccionado'}</p>
          {help && <p className="mt-0.5 text-xs text-ink-muted">{help}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={adminButton.secondary} onClick={() => setOpen(true)}>
              {current ? 'Substituir' : 'Escolher'}
              <span className="sr-only"> — {label}</span>
            </button>
            {current && (
              <>
                <a href={current.url} target="_blank" rel="noopener noreferrer" className={adminButton.ghost}>
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Abrir
                </a>
                <button type="button" className={adminButton.dangerGhost} onClick={() => field.onChange(null)}>
                  <X aria-hidden="true" className="size-4" />
                  Retirar
                  <span className="sr-only"> — {label}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}

      <MediaPicker
        open={open}
        kind={kind}
        onClose={() => setOpen(false)}
        onSelect={(media) => {
          setSelected(media)
          field.onChange(media.id)
        }}
      />
    </div>
  )
}
