import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { FormSection, SelectField, SwitchField, TextField, TranslatableField } from '../forms/fields'
import {
  applyServerErrors,
  listInput,
  listPayload,
  nullable,
  nullableId,
  translatedInput,
  type TranslatedInput,
} from '../forms/payload'
import { SaveBar } from '../forms/SaveBar'
import { useUnsavedChanges } from '../forms/useUnsavedChanges'
import { MediaField } from '../media/MediaField'
import type { AdminProfile } from '../types'
import { ErrorBlock, LoadingBlock, PageHeader } from '../ui/Page'
import { useToast } from '../ui/useToast'

interface ProfileForm {
  full_name: string
  display_name: string
  headline: TranslatedInput
  short_bio: TranslatedInput
  long_bio: TranslatedInput
  hero_phrases: TranslatedInput
  interests: TranslatedInput
  approach: TranslatedInput
  goals: TranslatedInput
  location: string
  public_email: string
  phone: string
  whatsapp: string
  availability_status: string
  availability_note: TranslatedInput
  show_availability: boolean
  photo_media_id: number | null
  hero_media_id: number | null
  cv_media_id: number | null
}

const translatedFields = ['headline', 'short_bio', 'long_bio', 'approach', 'goals', 'availability_note'] as const
const listFields = ['hero_phrases', 'interests'] as const

function toForm(profile: AdminProfile | null): ProfileForm {
  return {
    full_name: profile?.full_name ?? '',
    display_name: profile?.display_name ?? '',
    headline: translatedInput(profile?.headline),
    short_bio: translatedInput(profile?.short_bio),
    long_bio: translatedInput(profile?.long_bio),
    hero_phrases: listInput(profile?.hero_phrases),
    interests: listInput(profile?.interests),
    approach: translatedInput(profile?.approach),
    goals: translatedInput(profile?.goals),
    location: profile?.location ?? '',
    public_email: profile?.public_email ?? '',
    phone: profile?.phone ?? '',
    whatsapp: profile?.whatsapp ?? '',
    availability_status: profile?.availability_status ?? '',
    availability_note: translatedInput(profile?.availability_note),
    show_availability: profile?.show_availability ?? false,
    photo_media_id: profile?.photo_media_id ?? null,
    hero_media_id: profile?.hero_media_id ?? null,
    cv_media_id: profile?.cv_media_id ?? null,
  }
}

function toPayload(values: ProfileForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    full_name: values.full_name.trim(),
    display_name: nullable(values.display_name),
    location: nullable(values.location),
    public_email: nullable(values.public_email),
    phone: nullable(values.phone),
    whatsapp: nullable(values.whatsapp),
    availability_status: nullable(values.availability_status),
    show_availability: values.show_availability,
    photo_media_id: nullableId(values.photo_media_id),
    hero_media_id: nullableId(values.hero_media_id),
    cv_media_id: nullableId(values.cv_media_id),
  }
  for (const field of translatedFields) payload[field] = values[field]
  for (const field of listFields) payload[field] = listPayload(values[field])
  return payload
}

const fieldNames = [
  'full_name',
  'display_name',
  'location',
  'public_email',
  'phone',
  'whatsapp',
  'availability_status',
  'show_availability',
  'photo_media_id',
  'hero_media_id',
  'cv_media_id',
  ...[...translatedFields, ...listFields].flatMap((name) => [`${name}.pt`, `${name}.en`, name]),
]

export function ProfilePage() {
  const profile = useQuery({ queryKey: adminKeys.profile, queryFn: adminApi.profile })

  return (
    <>
      <PageHeader
        title="Perfil profissional"
        description="Informação apresentada no hero, em “Sobre mim” e no contacto. As alterações aparecem no site logo após guardar."
      />
      {profile.isPending ? (
        <LoadingBlock />
      ) : profile.isError ? (
        <ErrorBlock message={profile.error.message} onRetry={() => void profile.refetch()} />
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </>
  )
}

function ProfileForm({ profile }: { profile: AdminProfile | null }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [errors, setErrors] = useState<string[]>([])
  const form = useForm<ProfileForm>({ defaultValues: toForm(profile) })
  const { isDirty } = form.formState

  useUnsavedChanges(isDirty)

  const save = useMutation({
    mutationFn: (values: ProfileForm) => adminApi.updateProfile(toPayload(values)),
    onSuccess: (response) => {
      queryClient.setQueryData(adminKeys.profile, response.data)
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
      // O site público passa a mostrar os novos dados no próximo carregamento.
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
        <FormSection title="Identidade" description="Nome e título profissional mostrados no topo do site.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField name="full_name" label="Nome completo" required />
            <TextField
              name="display_name"
              label="Nome de apresentação"
              help="Opcional. Por omissão usa o nome completo."
            />
          </div>
          <TranslatableField name="headline" label="Título profissional" maxLength={160} />
          <TranslatableField
            name="hero_phrases"
            label="Frase de valor"
            list
            rows={2}
            help="A primeira linha aparece em destaque no hero."
          />
        </FormSection>

        <FormSection
          title="Apresentação"
          description="A apresentação curta aparece no hero; a biografia longa em “Sobre mim”."
        >
          <TranslatableField name="short_bio" label="Apresentação curta" multiline rows={3} maxLength={600} />
          <TranslatableField
            name="long_bio"
            label="Biografia longa"
            multiline
            rows={6}
            maxLength={6000}
            help="Separe parágrafos com uma linha em branco."
          />
          <TranslatableField
            name="approach"
            label="Abordagem à resolução de problemas"
            multiline
            rows={3}
            maxLength={2000}
          />
          <TranslatableField name="goals" label="Objectivos profissionais" multiline rows={3} maxLength={2000} />
          <TranslatableField name="interests" label="Interesses" list rows={5} />
          <p className="text-sm text-ink-muted">
            A formação e a especialidade são geridas em{' '}
            <Link to="/admin/percurso" className="text-accent-ink underline underline-offset-4">
              Percurso
            </Link>
            , para não duplicar informação.
          </p>
        </FormSection>

        <FormSection
          title="Imagens e CV"
          description="Sem fotografia, o site mostra uma composição gráfica com as iniciais."
        >
          <MediaField name="photo_media_id" label="Fotografia de perfil" kind="image" initial={profile?.photo} />
          <MediaField
            name="hero_media_id"
            label="Imagem do hero"
            kind="image"
            initial={profile?.hero_image}
            help="Opcional. Se definida, substitui a fotografia no topo do site."
          />
          <MediaField
            name="cv_media_id"
            label="Currículo (PDF)"
            kind="document"
            initial={profile?.cv}
            help="Sem CV, o botão de download não aparece."
          />
        </FormSection>

        <FormSection title="Contactos públicos" description="Só aparecem no site os campos preenchidos.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField name="public_email" label="Email público" type="email" />
            <TextField name="location" label="Localização" />
            <TextField name="phone" label="Telefone" type="tel" placeholder="+258 …" />
            <TextField name="whatsapp" label="WhatsApp" type="tel" placeholder="+258 …" />
          </div>
        </FormSection>

        <FormSection title="Disponibilidade" description="Só é mostrada no site quando activada.">
          <SwitchField name="show_availability" label="Mostrar disponibilidade no site" />
          <SelectField
            name="availability_status"
            label="Estado"
            emptyLabel="Não definido"
            options={[
              { value: 'available', label: 'Disponível para novos projectos' },
              { value: 'open_to_opportunities', label: 'Aberta a oportunidades' },
              { value: 'unavailable', label: 'Sem disponibilidade de momento' },
            ]}
          />
          <TranslatableField
            name="availability_note"
            label="Texto personalizado"
            maxLength={150}
            help="Opcional. Substitui o texto do estado."
          />
        </FormSection>

        <SaveBar isDirty={isDirty} isSaving={save.isPending} errors={errors} />
      </form>
    </FormProvider>
  )
}
