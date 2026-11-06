import { createContext, useContext } from 'react'

export interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
