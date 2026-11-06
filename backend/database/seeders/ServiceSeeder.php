<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

/**
 * Serviços possíveis, todos em rascunho: só devem ser publicados os que correspondem
 * a competências efectivamente disponíveis. Sem preços nem prazos.
 */
class ServiceSeeder extends Seeder
{
    private const SERVICES = [
        ['desenvolvimento-web', 'globe', 'Desenvolvimento web', 'Web development'],
        ['frontend', 'layout-template', 'Interfaces e frontend', 'Interfaces and frontend'],
        ['apis-backend', 'server', 'APIs e backend', 'APIs and backend'],
        ['sistemas-de-gestao', 'layout-dashboard', 'Sistemas de gestão', 'Management systems'],
        ['bases-de-dados', 'database', 'Modelação de bases de dados', 'Database modelling'],
        ['integracao-de-servicos', 'plug', 'Integração de serviços', 'Service integration'],
        ['aplicacoes-moveis', 'smartphone', 'Aplicações móveis', 'Mobile applications'],
        ['manutencao-evolucao', 'wrench', 'Manutenção e evolução', 'Maintenance and evolution'],
        ['analise-de-requisitos', 'clipboard-list', 'Análise inicial de requisitos', 'Initial requirements analysis'],
    ];

    public function run(): void
    {
        foreach (self::SERVICES as $position => [$slug, $icon, $pt, $en]) {
            Service::query()->firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => ['pt' => $pt, 'en' => $en],
                    'icon' => $icon,
                    'sort_order' => $position,
                    'is_published' => false,
                ],
            );
        }
    }
}
