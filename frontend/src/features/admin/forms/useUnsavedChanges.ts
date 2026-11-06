import { useEffect } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { useConfirm } from '../ui/useConfirm'

/**
 * Avisa antes de sair de uma página com alterações por guardar
 * (navegação interna com confirmação; fecho/recarregamento do separador com o aviso do navegador).
 */
export function useUnsavedChanges(isDirty: boolean) {
  const confirm = useConfirm()
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    void confirm({
      title: 'Sair sem guardar?',
      message: 'Há alterações que ainda não foram guardadas e serão perdidas.',
      confirmLabel: 'Sair sem guardar',
      destructive: true,
    }).then((leave) => (leave ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])

  useBeforeUnload((event) => {
    if (isDirty) event.preventDefault()
  })
}
