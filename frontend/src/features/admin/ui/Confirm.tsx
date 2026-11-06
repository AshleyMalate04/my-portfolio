import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './useConfirm'
import { Dialog } from './Dialog'
import { adminButton } from './styles'

/** Confirmação de operações destrutivas: `if (await confirm({...})) apagar()`. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(value: boolean) => void>(() => {})

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setOptions(next)
      }),
    [],
  )

  const close = (value: boolean) => {
    resolver.current(value)
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={options !== null}
        title={options?.title ?? ''}
        onClose={() => close(false)}
        size="sm"
        footer={
          <>
            <button type="button" className={adminButton.secondary} onClick={() => close(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={options?.destructive ? adminButton.danger : adminButton.primary}
              onClick={() => close(true)}
            >
              {options?.confirmLabel ?? 'Confirmar'}
            </button>
          </>
        }
      >
        <div className="text-sm leading-relaxed text-ink-muted">{options?.message}</div>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
