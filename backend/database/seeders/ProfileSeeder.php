<?php

namespace Database\Seeders;

use App\Models\Profile;
use Illuminate\Database\Seeder;

/**
 * Apenas factos fornecidos. Biografia longa, abordagem, objectivos, contactos, fotografia,
 * disponibilidade e CV ficam vazios para preencher no backoffice.
 */
class ProfileSeeder extends Seeder
{
    public function run(): void
    {
        if (Profile::query()->exists()) {
            return;
        }

        Profile::query()->create([
            'full_name' => 'Ashley da Amena Mario Malate',
            'headline' => [
                'pt' => 'full-stack developer ',
                'en' => 'full-stack developer',
            ],
            'short_bio' => [
                'pt' => 'Desenvolvo aplicações web e móveis — da análise do problema à interface, à API e à bse de dados.',
                'en' => 'Computer Science undergraduate at Universidade Pedagógica de Maputo, specialising in Systems Development Engineering. I build web and mobile applications — from understanding the problem to the interface, the API and the database.',
            ],
            'interests' => [
                'pt' => [
                    'Desenvolvimento de aplicações web e móveis',
                    'Frontend',
                    'Backend e APIs',
                    'Bases de dados relacionais',
                    'Análise de sistemas',
                    'Engenharia de software',
                    'Integração de serviços',
                    'Desenho de interfaces e prototipagem',
                ],
                'en' => [
                    'Web and mobile application development',
                    'Frontend',
                    'Backend and APIs',
                    'Relational databases',
                    'Systems analysis',
                    'Software engineering',
                    'Service integration',
                    'Interface design and prototyping',
                ],
            ],
            'location' => 'Maputo, Moçambique',
            'show_availability' => false,
        ]);
    }
}
