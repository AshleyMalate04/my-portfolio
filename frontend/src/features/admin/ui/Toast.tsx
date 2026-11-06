import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi } from './useToast'

type ToastTone = 'success' | 'error'
interface Toast {
  id: number
  tone: ToastTone
  message: string
}

let nextId = 0

/** Notificações discretas, anunciadas por leitores de ecrã (aria-live). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)), [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId
      setToasts((list) => [...list.slice(-3), { id, tone, message }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 4000)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-ink-inverse shadow-card"
          >
            {toast.tone === 'success' ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#8fd19e]" />
            ) : (
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
            )}
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-m-1 rounded p-1 text-ink-inverse/70 hover:text-ink-inverse"
            >
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">Fechar notificação</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
