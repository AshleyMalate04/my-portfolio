<?php

namespace Database\Seeders;

use App\Enums\PublicationStatus;
use App\Models\Project;
use App\Models\ProjectCategory;
use Illuminate\Database\Seeder;

/**
 * Projectos iniciais em RASCUNHO, apenas com a informação conhecida.
 * Estado, contribuição, períodos, links e resultados devem ser confirmados antes de publicar.
 */
class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'plataformas-digitais' => ['pt' => 'Plataformas digitais', 'en' => 'Digital platforms'],
            'sistemas-de-gestao' => ['pt' => 'Sistemas de gestão', 'en' => 'Management systems'],
            'seguranca-da-informacao' => ['pt' => 'Segurança da informação', 'en' => 'Information security'],
        ];

        $categoryIds = [];
        $position = 0;

        foreach ($categories as $slug => $name) {
            $categoryIds[$slug] = ProjectCategory::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'sort_order' => $position++],
            )->id;
        }

        foreach ($this->projects() as $sortOrder => $definition) {
            $technologies = $definition['technologies'] ?? [];
            unset($definition['technologies']);

            $project = Project::query()->firstOrCreate(
                ['slug' => $definition['slug']],
                [
                    ...$definition,
                    'project_category_id' => $categoryIds[$definition['project_category_id']],
                    'publication_status' => PublicationStatus::Draft,
                    'sort_order' => $sortOrder,
                ],
            );

            if ($project->wasRecentlyCreated && $technologies !== []) {
                $project->technologies()->sync(collect($technologies)->mapWithKeys(
                    fn (string $name, int $index) => [SkillSeeder::technology($name)->id => ['sort_order' => $index]],
                )->all());
            }
        }
    }

    /** @return list<array<string, mixed>> */
    private function projects(): array
    {
        return [
            [
                'slug' => 'confylar',
                'project_category_id' => 'plataformas-digitais',
                'title' => ['pt' => 'ConfyLar', 'en' => 'ConfyLar'],
                'summary' => [
                    'pt' => 'Plataforma que liga famílias a profissionais de cuidados infantis, com experiências móveis, interface web e backoffice.',
                    'en' => 'Platform connecting families with childcare professionals, with mobile experiences, a web interface and a back office.',
                ],
                'features' => [
                    'pt' => ['Gestão de pedidos', 'Correspondência entre necessidades e profissionais', 'Entrevistas', 'Contratos', 'Notificações'],
                    'en' => ['Request management', 'Matching needs with professionals', 'Interviews', 'Contracts', 'Notifications'],
                ],
                'technologies' => ['React', 'React Native', 'Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Drizzle ORM'],
                'internal_notes' => 'Confirmar estado, contribuição pessoal e quais funcionalidades do conceito estão implementadas. Não divulgar dados privados ou confidenciais.',
            ],
            [
                'slug' => 'sisaep-upm',
                'project_category_id' => 'sistemas-de-gestao',
                'title' => [
                    'pt' => 'SISAEP-UPM — Sistema de Submissão e Avaliação Ética de Projectos',
                    'en' => 'SISAEP-UPM — Research Ethics Submission and Review System',
                ],
                'summary' => [
                    'pt' => 'Sistema para apoiar a submissão, tramitação, avaliação ética, deliberação e acompanhamento de projectos de investigação no Comité de Ética em Pesquisa da Universidade Pedagógica de Maputo.',
                    'en' => 'System supporting the submission, processing, ethical review, deliberation and follow-up of research projects at the Research Ethics Committee of Universidade Pedagógica de Maputo.',
                ],
                'features' => [
                    'pt' => ['Submissão de projectos', 'Tramitação', 'Avaliação ética', 'Deliberação', 'Acompanhamento'],
                    'en' => ['Project submission', 'Processing workflow', 'Ethical review', 'Deliberation', 'Follow-up'],
                ],
                'internal_notes' => 'Descrever problema, actores e fluxos. Confirmar estado de implementação, tecnologias e contribuição antes de publicar.',
            ],
            [
                'slug' => 'ademo-votacao-eleitoral',
                'project_category_id' => 'sistemas-de-gestao',
                'title' => [
                    'pt' => 'ADEMO — Sistema de Votação Eleitoral',
                    'en' => 'ADEMO — Electoral Voting System',
                ],
                'summary' => [
                    'pt' => 'Sistema relacionado com os processos eleitorais da ADEMO.',
                    'en' => 'System supporting ADEMO’s electoral processes.',
                ],
                'internal_notes' => 'Funcionalidades a confirmar: gestão eleitoral, participação de eleitores, controlo de estados de votação, apresentação de resultados. Confirmar também tecnologias e estado.',
            ],
            [
                'slug' => 'casa-boa',
                'project_category_id' => 'plataformas-digitais',
                'title' => ['pt' => 'Casa Boa', 'en' => 'Casa Boa'],
                'summary' => [
                    'pt' => 'Iniciativa de plataforma que aproxima clientes e profissionais para a prestação de serviços.',
                    'en' => 'Platform initiative bringing clients and service professionals together.',
                ],
                'internal_notes' => 'Preencher funcionalidades reais, tecnologias confirmadas e links. Não indicar conclusão nem resultados sem confirmação.',
            ],
            [
                'slug' => 'partilha-de-recursos',
                'project_category_id' => 'plataformas-digitais',
                'title' => ['pt' => 'Partilha de Recursos', 'en' => 'Resource Sharing'],
                'summary' => [
                    'pt' => 'Plataforma de partilha de recursos com gestão de conteúdos e áreas de acesso para os perfis previstos no sistema.',
                    'en' => 'Resource-sharing platform with content management and access areas for the system’s user profiles.',
                ],
                'internal_notes' => 'Completar com os dados reais (perfis, funcionalidades, tecnologias, estado) antes de publicar.',
            ],
            [
                'slug' => 'esteganografia-e-criptografia',
                'project_category_id' => 'seguranca-da-informacao',
                'title' => [
                    'pt' => 'Aplicação de Esteganografia e Criptografia',
                    'en' => 'Steganography and Cryptography Application',
                ],
                'internal_notes' => 'Manter em rascunho até o estado, as tecnologias e a descrição serem confirmados.',
            ],
        ];
    }
}
