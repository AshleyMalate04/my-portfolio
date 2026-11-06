import { Badge } from '../ui/Page'
import type { AdminRecord } from '../types'
import type { CollectionConfig, CollectionField } from './types'
import { pt } from './values'

const date = (value: unknown) => (typeof value === 'string' && value ? value : null)
const period = (record: AdminRecord) => {
  const start = date(record.started_at)
  const end = record.is_current ? 'actualmente' : date(record.ended_at)
  return [start, end].filter(Boolean).join(' → ') || 'Sem datas'
}

const slugField: CollectionField = {
  name: 'slug',
  label: 'Identificador (slug)',
  type: 'text',
  required: true,
  help: 'Minúsculas, números e hífenes (ex.: desenvolvimento-web). Usado internamente e em URLs.',
}

const publishedField: CollectionField = { name: 'is_published', label: 'Publicado no site', type: 'switch' }

export const projectCategoriesConfig: CollectionConfig = {
  resource: 'project-categories',
  title: 'Categorias de projectos',
  singular: 'Categoria',
  description: 'Agrupam os projectos e servem de filtro no site. Só aparecem categorias com projectos publicados.',
  fields: [{ name: 'name', label: 'Nome', type: 'translatable', required: true, maxLength: 100 }, slugField],
  primary: (r) => pt(r.name),
  secondary: (r) => <span className="font-mono text-xs">{String(r.slug)}</span>,
}

export const technologiesConfig: CollectionConfig = {
  resource: 'technologies',
  title: 'Tecnologias',
  singular: 'Tecnologia',
  description:
    'Usadas nos projectos e nas competências. Uma tecnologia só aparece no site se estiver ligada a conteúdo publicado.',
  sortable: false,
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true, maxLength: 100 },
    slugField,
    { name: 'website_url', label: 'Site oficial', type: 'url', full: true },
  ],
  primary: (r) => String(r.name),
  secondary: (r) => <span className="font-mono text-xs">{String(r.slug)}</span>,
}

export const skillCategoriesConfig: CollectionConfig = {
  resource: 'skill-categories',
  title: 'Categorias de competências',
  singular: 'Categoria',
  publishable: true,
  defaults: { is_published: true },
  fields: [
    { name: 'name', label: 'Nome', type: 'translatable', required: true, maxLength: 100 },
    slugField,
    { name: 'description', label: 'Descrição', type: 'translatable-text', maxLength: 500, rows: 2 },
    publishedField,
  ],
  primary: (r) => pt(r.name),
  secondary: (r) => `${Number(r.skills_count ?? 0)} competência(s)`,
}

export const skillsConfig: CollectionConfig = {
  resource: 'skills',
  title: 'Competências',
  singular: 'Competência',
  description: 'Mostre apenas competências confirmadas. Não há percentagens: a profundidade vê-se nos projectos.',
  publishable: true,
  scope: {
    param: 'skill_category_id',
    label: 'Categoria',
    resource: 'skill-categories',
    optionLabel: (r) => pt(r.name),
  },
  fields: [
    {
      name: 'skill_category_id',
      label: 'Categoria',
      type: 'select',
      required: true,
      emptyLabel: 'Escolha uma categoria',
      optionsFrom: { resource: 'skill-categories', label: (r) => pt(r.name) },
    },
    {
      name: 'technology_id',
      label: 'Tecnologia associada',
      type: 'select',
      emptyLabel: 'Nenhuma',
      optionsFrom: { resource: 'technologies', label: (r) => String(r.name) },
      help: 'Opcional. Liga a competência à tecnologia usada nos projectos.',
    },
    { name: 'name', label: 'Nome', type: 'translatable', required: true, maxLength: 100 },
    { name: 'description', label: 'Descrição curta', type: 'translatable-text', maxLength: 500, rows: 2 },
    publishedField,
  ],
  primary: (r) => pt(r.name),
  secondary: (r) => pt((r.category as AdminRecord | undefined)?.name),
}

export const servicesConfig: CollectionConfig = {
  resource: 'services',
  title: 'Serviços',
  singular: 'Serviço',
  description:
    'Publique apenas serviços que correspondem a competências reais. Não indique preços nem prazos garantidos.',
  publishable: true,
  fields: [
    { name: 'title', label: 'Título', type: 'translatable', required: true, maxLength: 150 },
    slugField,
    {
      name: 'icon',
      label: 'Ícone',
      type: 'select',
      emptyLabel: 'Ícone genérico',
      options: [
        { value: 'globe', label: 'Globo (web)' },
        { value: 'layout-template', label: 'Interface (frontend)' },
        { value: 'server', label: 'Servidor (backend/APIs)' },
        { value: 'layout-dashboard', label: 'Painel (sistemas de gestão)' },
        { value: 'database', label: 'Base de dados' },
        { value: 'plug', label: 'Ficha (integração)' },
        { value: 'smartphone', label: 'Telemóvel (aplicações móveis)' },
        { value: 'wrench', label: 'Chave (manutenção)' },
        { value: 'clipboard-list', label: 'Lista (requisitos)' },
        { value: 'code-xml', label: 'Código' },
      ],
    },
    { name: 'summary', label: 'Resumo', type: 'translatable-text', maxLength: 500, rows: 2 },
    { name: 'description', label: 'Descrição e benefícios', type: 'translatable-text', maxLength: 3000, rows: 4 },
    publishedField,
  ],
  primary: (r) => pt(r.title),
  secondary: (r) => pt(r.summary),
}

export const processStepsConfig: CollectionConfig = {
  resource: 'process-steps',
  title: 'Metodologia',
  singular: 'Etapa',
  description: 'Etapas da forma de trabalhar, apresentadas no site como abordagem e não como promessa.',
  publishable: true,
  fields: [
    { name: 'title', label: 'Título', type: 'translatable', required: true, maxLength: 150 },
    { name: 'description', label: 'Descrição', type: 'translatable-text', maxLength: 1000, rows: 3 },
    publishedField,
  ],
  primary: (r) => pt(r.title),
  secondary: (r) => pt(r.description),
}

const dateFields: CollectionField[] = [
  { name: 'started_at', label: 'Início', type: 'date', help: 'Deixe em branco se não tiver a data confirmada.' },
  { name: 'ended_at', label: 'Fim', type: 'date' },
  { name: 'is_current', label: 'Em curso', type: 'switch' },
]

export const educationsConfig: CollectionConfig = {
  resource: 'educations',
  title: 'Formação',
  singular: 'Formação',
  publishable: true,
  fields: [
    { name: 'institution', label: 'Instituição', type: 'text', required: true },
    { name: 'institution_short_name', label: 'Sigla', type: 'text', maxLength: 50 },
    { name: 'degree', label: 'Grau / curso', type: 'translatable', required: true },
    { name: 'specialization', label: 'Especialidade', type: 'translatable' },
    { name: 'field', label: 'Área', type: 'translatable' },
    { name: 'location', label: 'Localização', type: 'text' },
    ...dateFields,
    { name: 'description', label: 'Descrição', type: 'translatable-text', maxLength: 2000, rows: 3 },
    publishedField,
  ],
  primary: (r) => pt(r.degree),
  secondary: (r) => `${String(r.institution)} · ${period(r)}`,
}

export const experiencesConfig: CollectionConfig = {
  resource: 'experiences',
  title: 'Experiência',
  singular: 'Experiência',
  publishable: true,
  defaults: { employment_type: 'internship' },
  fields: [
    { name: 'organization', label: 'Organização', type: 'text', required: true },
    {
      name: 'employment_type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'job', label: 'Emprego' },
        { value: 'internship', label: 'Estágio' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'volunteer', label: 'Voluntariado' },
        { value: 'academic', label: 'Académico' },
        { value: 'other', label: 'Outro' },
      ],
    },
    { name: 'role', label: 'Função', type: 'translatable', required: true },
    { name: 'location', label: 'Localização', type: 'text' },
    ...dateFields,
    { name: 'description', label: 'Descrição', type: 'translatable-text', maxLength: 2000, rows: 3 },
    publishedField,
  ],
  primary: (r) => pt(r.role),
  secondary: (r) => `${String(r.organization)} · ${period(r)}`,
}

export const certificationsConfig: CollectionConfig = {
  resource: 'certifications',
  title: 'Cursos e certificações',
  singular: 'Curso ou certificação',
  publishable: true,
  defaults: { kind: 'course' },
  fields: [
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'course', label: 'Curso' },
        { value: 'certification', label: 'Certificação' },
      ],
    },
    { name: 'issuer', label: 'Entidade', type: 'text', required: true },
    { name: 'name', label: 'Nome', type: 'translatable', required: true },
    { name: 'issued_at', label: 'Data de emissão', type: 'date' },
    { name: 'expires_at', label: 'Validade', type: 'date' },
    { name: 'credential_id', label: 'Identificador da credencial', type: 'text' },
    { name: 'credential_url', label: 'Ligação da credencial', type: 'url' },
    {
      name: 'document_media_id',
      label: 'Certificado (PDF)',
      type: 'media',
      kind: 'document',
      mediaRelation: 'document',
    },
    { name: 'description', label: 'Descrição', type: 'translatable-text', maxLength: 2000, rows: 3 },
    publishedField,
  ],
  primary: (r) => pt(r.name),
  secondary: (r) => `${String(r.issuer)}${date(r.issued_at) ? ` · ${String(r.issued_at)}` : ''}`,
}

export const socialLinksConfig: CollectionConfig = {
  resource: 'social-links',
  title: 'Redes sociais',
  singular: 'Ligação',
  description: 'Só aparecem no site ligações publicadas. Para email use mailto:nome@dominio.',
  publishable: true,
  defaults: { platform: 'linkedin', is_published: true },
  fields: [
    {
      name: 'platform',
      label: 'Plataforma',
      type: 'select',
      required: true,
      options: [
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'github', label: 'GitHub' },
        { value: 'email', label: 'Email' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'x', label: 'X' },
        { value: 'behance', label: 'Behance' },
        { value: 'dribbble', label: 'Dribbble' },
        { value: 'website', label: 'Site pessoal' },
        { value: 'other', label: 'Outra' },
      ],
    },
    { name: 'label', label: 'Texto apresentado', type: 'text', maxLength: 100, help: 'Ex.: LinkedIn, GitHub.' },
    {
      name: 'url',
      label: 'Endereço',
      type: 'text',
      required: true,
      full: true,
      help: 'https://… ou mailto:… para email.',
    },
    publishedField,
  ],
  primary: (r) => String(r.label ?? r.platform),
  secondary: (r) => <span className="break-all">{String(r.url)}</span>,
}

export const testimonialsConfig: CollectionConfig = {
  resource: 'testimonials',
  title: 'Testemunhos',
  singular: 'Testemunho',
  description: 'Só são publicados testemunhos reais com autorização confirmada do autor.',
  publishable: true,
  fields: [
    { name: 'author_name', label: 'Autor', type: 'text', required: true },
    { name: 'author_organization', label: 'Organização', type: 'text' },
    { name: 'author_role', label: 'Função do autor', type: 'translatable' },
    { name: 'quote', label: 'Testemunho', type: 'translatable-text', required: true, maxLength: 2000, rows: 4 },
    {
      name: 'author_media_id',
      label: 'Fotografia do autor',
      type: 'media',
      kind: 'image',
      mediaRelation: 'author_photo',
    },
    {
      name: 'consent_confirmed',
      label: 'Autorização confirmada',
      type: 'switch',
      help: 'O autor autorizou a publicação deste texto com o nome indicado.',
    },
    publishedField,
  ],
  primary: (r) => String(r.author_name),
  secondary: (r) =>
    r.consent_confirmed ? (
      <Badge tone="green">Autorizado</Badge>
    ) : (
      <Badge tone="coral">Sem autorização — não pode ser publicado</Badge>
    ),
}
