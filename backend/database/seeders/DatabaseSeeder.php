<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Conteúdo inicial com os dados conhecidos do perfil.
 *
 * - Não cria utilizadores nem credenciais: use "php artisan admin:create".
 * - Usa firstOrCreate: voltar a executar não substitui alterações feitas no backoffice.
 * - Projectos e serviços ficam em rascunho até serem confirmados e publicados.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SiteSettingSeeder::class,
            ProfileSeeder::class,
            SkillSeeder::class,
            JourneySeeder::class,
            ServiceSeeder::class,
            ProcessStepSeeder::class,
            ProjectSeeder::class,
        ]);
    }
}
