import { createContext, useContext, type ReactNode } from 'react'

export interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  /** Operações destrutivas usam o botão vermelho. */
  destructive?: boolean
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn>(async () => false)

/** Confirmação de operações destrutivas: if (await confirm({...})) apagar(). */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext)
}
