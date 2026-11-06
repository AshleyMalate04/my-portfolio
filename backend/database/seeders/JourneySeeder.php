<?php

namespace Database\Seeders;

use App\Models\Education;
use Illuminate\Database\Seeder;

/**
 * Formação confirmada. Datas, experiência, cursos e certificações são acrescentados no backoffice.
 */
class JourneySeeder extends Seeder
{
    public function run(): void
    {
        Education::query()->firstOrCreate(
            ['institution' => 'Universidade Pedagógica de Maputo'],
            [
                'institution_short_name' => 'UPM',
                'degree' => ['pt' => 'Licenciatura em Informática', 'en' => 'Bachelor’s degree in Computer Science'],
                'specialization' => [
                    'pt' => 'Engenharia de Desenvolvimento de Sistemas',
                    'en' => 'Systems Development Engineering',
                ],
                'location' => 'Maputo, Moçambique',
                'is_current' => true,
                'sort_order' => 0,
                'is_published' => true,
            ],
        );
    }
}
