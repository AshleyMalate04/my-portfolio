import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { SESSION_EXPIRED_EVENT } from '../../app/queryClient'
import { adminKeys } from '../../lib/api/admin'
import { queryKeys } from '../../lib/api/queryKeys'
import { ConfirmProvider } from './ui/Confirm'
import { ToastProvider } from './ui/Toast'

/**
 * Raiz de todas as rotas /admin: notificações, confirmações, exclusão da indexação e
 * redireccionamento para o login quando a sessão expira (qualquer pedido com 401).
 */
export function AdminRoot() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.querySelector('meta[name="robots"]')?.remove()
    document.head.appendChild(meta)
    document.documentElement.lang = 'pt-MZ'
    return () => meta.remove()
  }, [])

  useEffect(() => {
    const onExpired = () => {
      queryClient.removeQueries({ queryKey: adminKeys.all })
      queryClient.removeQueries({ queryKey: queryKeys.adminSession })
      if (!window.location.pathname.startsWith('/admin/login')) {
        navigate('/admin/login?sessao=expirada', { replace: true, state: { from: window.location.pathname } })
      }
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [navigate, queryClient])

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-dvh bg-surface text-ink">
          <Outlet />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
