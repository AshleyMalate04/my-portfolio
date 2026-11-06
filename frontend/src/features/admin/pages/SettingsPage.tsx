import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { ApiError } from '../../../lib/api/client'
import type { SectionKey } from '../../../lib/api/types'
import { FormSection, SwitchField, TextField, TranslatableField } from '../forms/fields'
import { applyServerErrors, nullable, nullableId, translatedInput, type TranslatedInput } from '../forms/payload'
import { SaveBar } from '../forms/SaveBar'
import { useUnsavedChanges } from '../forms/useUnsavedChanges'
import { MediaField } from '../media/MediaField'
import type { SettingsPayload } from '../types'
import { ErrorBlock, LoadingBlock, PageHeader } from '../ui/Page'
import { PasswordInput } from '../ui/PasswordInput'
import { adminButton, cardStyle } from '../ui/styles'
import { useToast } from '../ui/useToast'

const sections: { key: SectionKey; label: string }[] = [
  { key: 'about', label: 'Sobre mim' },
  { key: 'skills', label: 'Competências' },
  { key: 'projects', label: 'Projectos' },
  { key: 'services', label: 'Serviços' },
  { key: 'process', label: 'Metodologia' },
  { key: 'journey', label: 'Percurso' },
  { key: 'testimonials', label: 'Testemunhos' },
  { key: 'contact', label: 'Contacto' },
]

const translated = ['site_tagline', 'seo_title', 'seo_description', 'primary_cta_label', 'contact_headline'] as const
type TranslatedKey = (typeof translated)[number]

type SettingsForm = {
  site_name: string
  brand_wordmark: string
  logo_media_id: number | null
  favicon_media_id: number | null
  og_image_media_id: number | null
  sections: Record<SectionKey, boolean>
} & Record<TranslatedKey, TranslatedInput>

function toForm({ values }: SettingsPayload): SettingsForm {
  return {
    site_name: values.site_name ?? '',
    brand_wordmark: values.brand_wordmark ?? '',
    logo_media_id: values.logo_media_id ?? null,
    favicon_media_id: values.favicon_media_id ?? null,
    og_image_media_id: values.og_image_media_id ?? null,
    sections: Object.fromEntries(sections.map(({ key }) => [key, values.sections?.[key] !== false])) as Record<
      SectionKey,
      boolean
    >,
    ...(Object.fromEntries(translated.map((key) => [key, translatedInput(values[key])])) as Record<
      TranslatedKey,
      TranslatedInput
    >),
  }
}

const fieldNames = [
  'site_name',
  'brand_wordmark',
  'logo_media_id',
  'favicon_media_id',
  'og_image_media_id',
  'sections',
  ...translated.flatMap((key) => [`${key}.pt`, `${key}.en`, key]),
]

export function SettingsPage() {
  const settings = useQuery({ queryKey: adminKeys.settings, queryFn: adminApi.settings })

  return (
    <>
      <PageHeader title="Definições" description="Identidade do site, SEO, secções visíveis e segurança da conta." />
      {settings.isPending ? (
        <LoadingBlock />
      ) : settings.isError ? (
        <ErrorBlock message={settings.error.message} onRetry={() => void settings.refetch()} />
      ) : (
        <>
          <SettingsForm settings={settings.data} />
          <ChangePassword />
        </>
      )}
    </>
  )
}

function SettingsForm({ settings }: { settings: SettingsPayload }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [errors, setErrors] = useState<string[]>([])
  const form = useForm<SettingsForm>({ defaultValues: toForm(settings) })
  const { isDirty } = form.formState

  useUnsavedChanges(isDirty)

  const save = useMutation({
    mutationFn: (values: SettingsForm) =>
      adminApi.updateSettings({
        ...values,
        site_name: values.site_name.trim(),
        brand_wordmark: nullable(values.brand_wordmark),
        logo_media_id: nullableId(values.logo_media_id),
        favicon_media_id: nullableId(values.favicon_media_id),
        og_image_media_id: nullableId(values.og_image_media_id),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(adminKeys.settings, response.data)
      void queryClient.invalidateQueries({ queryKey: ['home'] })
      form.reset(toForm(response.data))
      setErrors([])
      toast.success(response.message)
    },
    onError: (error) => setErrors(applyServerErrors(error, form.setError, fieldNames)),
  })

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit((values) => save.mutate(values))}>
        <FormSection title="Identidade" description="Nome do site e marca tipográfica do cabeçalho.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField name="site_name" label="Nome do site" required maxLength={120} />
            <TextField
              name="brand_wordmark"
              label="Marca tipográfica"
              maxLength={30}
              help="Texto do logótipo (ex.: ashley). Vazio usa “ashley”."
            />
          </div>
          <TranslatableField name="site_tagline" label="Descrição curta do site" maxLength={160} />
          <MediaField
            name="logo_media_id"
            label="Logótipo em imagem"
            kind="image"
            initial={settings.media.logo_media_id}
            help="Opcional. Se definido, substitui a marca tipográfica."
          />
          <MediaField
            name="favicon_media_id"
            label="Favicon"
            kind="image"
            initial={settings.media.favicon_media_id}
            help="Imagem quadrada (PNG), pelo menos 64×64 px."
          />
        </FormSection>

        <FormSection
          title="SEO e partilha"
          description="Título e descrição usados nos motores de busca e nas pré-visualizações de partilha."
        >
          <TranslatableField name="seo_title" label="Título SEO" maxLength={70} help="Até 70 caracteres." />
          <TranslatableField
            name="seo_description"
            label="Descrição SEO"
            multiline
            rows={2}
            maxLength={170}
            help="Até 170 caracteres."
          />
          <MediaField
            name="og_image_media_id"
            label="Imagem de partilha (Open Graph)"
            kind="image"
            initial={settings.media.og_image_media_id}
            help="Recomendado 1200×630 px."
          />
        </FormSection>

        <FormSection
          title="Contacto"
          description="A secção final do site: uma frase em destaque e, por baixo, os teus contactos (Perfil e Redes sociais) e o CV."
        >
          <TranslatableField
            name="contact_headline"
            label="Frase em destaque"
            multiline
            rows={2}
            maxLength={160}
            help="Ex.: Cada bom sistema começa com uma boa conversa."
          />
          <TranslatableField
            name="primary_cta_label"
            label="Texto do botão de contacto no menu"
            maxLength={40}
            help="Ex.: Vamos conversar."
          />
        </FormSection>

        <FormSection
          title="Secções visíveis"
          description="Uma secção activa só aparece se também tiver conteúdo publicado. Os testemunhos ficam ocultos sem testemunhos autorizados."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {sections.map((section) => (
              <SwitchField key={section.key} name={`sections.${section.key}`} label={section.label} />
            ))}
          </div>
        </FormSection>

        <SaveBar isDirty={isDirty} isSaving={save.isPending} errors={errors} />
      </form>
    </FormProvider>
  )
}

function ChangePassword() {
  const toast = useToast()
  const [values, setValues] = useState({ current_password: '', password: '', password_confirmation: '' })
  const change = useMutation({
    mutationFn: adminApi.changePassword,
    onSuccess: (response) => {
      toast.success(response.message)
      setValues({ current_password: '', password: '', password_confirmation: '' })
    },
  })
  const error = change.error instanceof ApiError ? change.error : null

  const input = (name: keyof typeof values, label: string, autoComplete: string) => (
    <div>
      <label htmlFor={`password-${name}`} className="block text-sm font-medium">
        {label}
      </label>
      <PasswordInput
        id={`password-${name}`}
        autoComplete={autoComplete}
        value={values[name]}
        onChange={(event) => setValues({ ...values, [name]: event.target.value })}
        aria-invalid={Boolean(error?.fieldError(name))}
        className="mt-1.5 block w-full min-h-10 rounded-lg border border-ink/20 bg-surface-raised px-3 text-sm aria-invalid:border-danger"
      />
      {error?.fieldError(name) && <span className="mt-1 block text-xs text-danger">{error.fieldError(name)}</span>}
    </div>
  )

  return (
    <section className={`${cardStyle} mt-12 p-6`} aria-labelledby="password-title">
      <h2 id="password-title" className="font-display text-lg font-bold">
        Alterar palavra-passe
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Mínimo de 12 caracteres, com maiúsculas, minúsculas, números e símbolos.
      </p>
      {error && error.kind !== 'validation' && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error.message}
        </p>
      )}
      <form
        className="mt-4 grid gap-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault()
          change.mutate(values)
        }}
      >
        {input('current_password', 'Palavra-passe actual', 'current-password')}
        {input('password', 'Nova palavra-passe', 'new-password')}
        {input('password_confirmation', 'Confirmar nova', 'new-password')}
        <div className="md:col-span-3">
          <button
            type="submit"
            className={adminButton.secondary}
            disabled={change.isPending || !values.current_password || !values.password}
          >
            Alterar palavra-passe
          </button>
        </div>
      </form>
    </section>
  )
}
