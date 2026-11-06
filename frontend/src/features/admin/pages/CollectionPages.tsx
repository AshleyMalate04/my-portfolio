import { CollectionPage } from '../collections/CollectionPage'
import {
  certificationsConfig,
  educationsConfig,
  experiencesConfig,
  processStepsConfig,
  projectCategoriesConfig,
  servicesConfig,
  skillCategoriesConfig,
  skillsConfig,
  socialLinksConfig,
  technologiesConfig,
  testimonialsConfig,
} from '../collections/configs'
import { PageHeader } from '../ui/Page'

export const ServicesPage = () => <CollectionPage config={servicesConfig} />
export const ProcessStepsPage = () => <CollectionPage config={processStepsConfig} />
export const SocialLinksPage = () => <CollectionPage config={socialLinksConfig} />
export const TestimonialsPage = () => <CollectionPage config={testimonialsConfig} />
export const TechnologiesPage = () => <CollectionPage config={technologiesConfig} />
export const ProjectCategoriesPage = () => <CollectionPage config={projectCategoriesConfig} />

export function SkillsPage() {
  return (
    <>
      <PageHeader
        title="Competências"
        description="As categorias agrupam as competências no site. Uma categoria só aparece se tiver competências publicadas."
      />
      <div className="space-y-12">
        <CollectionPage config={skillCategoriesConfig} embedded />
        <CollectionPage config={skillsConfig} embedded />
      </div>
    </>
  )
}

export function JourneyPage() {
  return (
    <>
      <PageHeader
        title="Percurso"
        description="Formação, experiência, estágios, cursos e certificações. Datas só aparecem no site quando estão preenchidas."
      />
      <div className="space-y-12">
        <CollectionPage config={educationsConfig} embedded />
        <CollectionPage config={experiencesConfig} embedded />
        <CollectionPage config={certificationsConfig} embedded />
      </div>
    </>
  )
}
