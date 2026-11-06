<?php

namespace Database\Seeders;

use App\Models\ProcessStep;
use Illuminate\Database\Seeder;

/**
 * Abordagem de trabalho (não uma promessa universal). Textos editáveis no backoffice.
 */
class ProcessStepSeeder extends Seeder
{
    public function run(): void
    {
        if (ProcessStep::query()->exists()) {
            return;
        }

        $steps = [
            [
                ['pt' => 'Compreender o problema', 'en' => 'Understand the problem'],
                ['pt' => 'Perceber o contexto, as pessoas envolvidas e o que precisa realmente de mudar.', 'en' => 'Understand the context, the people involved and what really needs to change.'],
            ],
            [
                ['pt' => 'Analisar os requisitos', 'en' => 'Analyse the requirements'],
                ['pt' => 'Transformar necessidades em requisitos claros, prioridades e limites.', 'en' => 'Turn needs into clear requirements, priorities and constraints.'],
            ],
            [
                ['pt' => 'Conceber a solução e a experiência', 'en' => 'Design the solution and the experience'],
                ['pt' => 'Definir a arquitectura, os dados e os fluxos de interface antes de escrever código.', 'en' => 'Define the architecture, the data and the interface flows before writing code.'],
            ],
            [
                ['pt' => 'Desenvolver e testar', 'en' => 'Build and test'],
                ['pt' => 'Implementar por etapas verificáveis, com atenção à qualidade, à segurança e à usabilidade.', 'en' => 'Implement in verifiable steps, with attention to quality, security and usability.'],
            ],
            [
                ['pt' => 'Preparar a entrega e a evolução', 'en' => 'Prepare delivery and evolution'],
                ['pt' => 'Documentar, colocar em funcionamento e deixar o sistema preparado para crescer.', 'en' => 'Document, deploy and leave the system ready to grow.'],
            ],
        ];

        foreach ($steps as $position => [$title, $description]) {
            ProcessStep::query()->create([
                'title' => $title,
                'description' => $description,
                'sort_order' => $position,
                'is_published' => true,
            ]);
        }
    }
}
