import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { adminApi } from '../../../lib/api/admin'
import { ApiError } from '../../../lib/api/client'
import { queryKeys } from '../../../lib/api/queryKeys'
import { ThemeSwitcher } from '../../../theme/ThemeSwitcher'
import { PasswordInput } from '../ui/PasswordInput'
import { adminButton, inputStyle } from '../ui/styles'
import { useAdminSession } from '../useAdminSession'

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Backoffice`
  }, [title])

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div aria-hidden="true" className="relative hidden overflow-hidden bg-band lg:block">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent" />
        <div className="absolute bottom-16 left-16 size-40 bg-butter-300" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(183_160_217/0.35)_1.5px,transparent_1.5px)] bg-[size:24px_24px]" />
        <p className="absolute bottom-16 left-64 font-display text-6xl font-extrabold text-band-ink">
          ashley<span className="text-accent">.</span>
        </p>
      </div>
      <div className="relative flex items-center justify-center px-5 py-12">
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>
        <div className="w-full max-w-sm">
          <p className="font-display text-2xl font-extrabold lg:hidden">
            ashley<span className="text-accent">.</span>
          </p>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const Input = props.type === 'password' ? PasswordInput : 'input'
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputStyle}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function Notice({ tone, children }: { tone: 'error' | 'info' | 'success'; children: ReactNode }) {
  const styles = {
    error: 'border-danger/30 bg-danger/5',
    info: 'border-ink/15 bg-surface-raised',
    success: 'border-success/30 bg-success/10',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-3 text-sm ${styles[tone]}`}>
      {children}
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const session = useAdminSession()
  const options = useQuery({ queryKey: ['admin', 'auth-options'], queryFn: adminApi.authOptions })
  const [form, setForm] = useState({ email: '', password: '', remember: false })

  const login = useMutation({
    mutationFn: adminApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.adminSession, user)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from.startsWith('/admin') && !from.startsWith('/admin/login') ? from : '/admin', {
        replace: true,
      })
    },
  })

  if (session.isSuccess) return <Navigate to="/admin" replace />

  const error = login.error instanceof ApiError ? login.error : null
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate(form)
  }

  return (
    <AuthLayout title="Iniciar sessão">
      {params.get('sessao') === 'expirada' && !login.isError && (
        <Notice tone="info">A sessão expirou. Inicie sessão novamente para continuar.</Notice>
      )}
      {error && (
        <Notice tone="error">
          {error.kind === 'validation'
            ? (error.fieldError('email') ?? error.fieldError('password') ?? error.message)
            : error.message}
        </Notice>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field
          label="Email"
          type="email"
          autoComplete="username"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Field
          label="Palavra-passe"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(event) => setForm({ ...form, remember: event.target.checked })}
            className="size-4 accent-ink"
          />
          Manter sessão iniciada neste dispositivo
        </label>
        <button type="submit" className={`${adminButton.primary} w-full`} disabled={login.isPending}>
          {login.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          Entrar
        </button>
      </form>
      {options.data?.password_reset && (
        <p className="mt-6 text-center text-sm">
          <Link to="/admin/recuperar-palavra-passe" className="text-accent-ink underline underline-offset-4">
            Esqueci-me da palavra-passe
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const options = useQuery({ queryKey: ['admin', 'auth-options'], queryFn: adminApi.authOptions })
  const request = useMutation({ mutationFn: adminApi.forgotPassword })

  return (
    <AuthLayout title="Recuperar palavra-passe">
      {options.data && !options.data.password_reset ? (
        <Notice tone="info">
          A recuperação por email não está disponível porque o envio de email não está configurado. Use o comando{' '}
          <code className="font-mono">php artisan admin:create</code> no servidor para definir uma nova palavra-passe.
        </Notice>
      ) : request.isSuccess ? (
        <Notice tone="success">{request.data.message}</Notice>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            Indique o email da conta. Se for de um administrador, receberá uma ligação.
          </p>
          {request.isError && <Notice tone="error">{request.error.message}</Notice>}
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              request.mutate(email)
            }}
          >
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className={`${adminButton.primary} w-full`} disabled={request.isPending}>
              Enviar ligação
            </button>
          </form>
        </>
      )}
      <p className="mt-6 text-sm">
        <Link to="/admin/login" className="inline-flex items-center gap-1 text-ink-muted hover:text-ink">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar ao início de sessão
        </Link>
      </p>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const reset = useMutation({ mutationFn: adminApi.resetPassword })
  const error = reset.error instanceof ApiError ? reset.error : null
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  return (
    <AuthLayout title="Nova palavra-passe">
      {!token || !email ? (
        <Notice tone="error">Ligação incompleta. Peça uma nova ligação de recuperação.</Notice>
      ) : reset.isSuccess ? (
        <Notice tone="success">
          {reset.data.message}{' '}
          <Link to="/admin/login" className="font-medium underline">
            Iniciar sessão
          </Link>
        </Notice>
      ) : (
        <>
          {error && error.kind !== 'validation' && <Notice tone="error">{error.message}</Notice>}
          {error?.fieldError('email') && <Notice tone="error">{error.fieldError('email')}</Notice>}
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              reset.mutate({ token, email, ...form })
            }}
          >
            <p className="text-sm text-ink-muted">Conta: {email}</p>
            <Field
              label="Nova palavra-passe"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={error?.fieldError('password')}
            />
            <Field
              label="Confirmar palavra-passe"
              type="password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            />
            <p className="text-xs text-ink-muted">
              Mínimo de 12 caracteres, com maiúsculas, minúsculas, números e símbolos.
            </p>
            <button type="submit" className={`${adminButton.primary} w-full`} disabled={reset.isPending}>
              Guardar nova palavra-passe
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
