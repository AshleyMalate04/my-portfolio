<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Technology;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SkillSeeder extends Seeder
{
    /**
     * Tecnologias indicadas no perfil, agrupadas por categoria de competência.
     */
    private const CATEGORIES = [
        'frontend' => [
            'name' => ['pt' => 'Frontend', 'en' => 'Frontend'],
            'technologies' => ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS'],
        ],
        'mobile' => [
            'name' => ['pt' => 'Aplicações móveis', 'en' => 'Mobile applications'],
            'technologies' => ['React Native'],
        ],
        'backend-apis' => [
            'name' => ['pt' => 'Backend e APIs', 'en' => 'Backend and APIs'],
            'technologies' => ['Laravel', 'PHP'],
        ],
        'bases-de-dados' => [
            'name' => ['pt' => 'Bases de dados', 'en' => 'Databases'],
            'technologies' => ['PostgreSQL', 'MySQL'],
        ],
        'infraestrutura-ferramentas' => [
            'name' => ['pt' => 'Infra-estrutura e ferramentas', 'en' => 'Infrastructure and tooling'],
            'technologies' => ['Docker', 'Nginx', 'Git', 'GitHub'],
        ],
        'design-prototipagem' => [
            'name' => ['pt' => 'Design e prototipagem', 'en' => 'Design and prototyping'],
            'technologies' => ['Figma'],
        ],
    ];

    /**
     * Associadas a projectos específicos; não são apresentadas como competências confirmadas.
     */
    private const PROJECT_ONLY_TECHNOLOGIES = ['Node.js', 'Express', 'Drizzle ORM'];

    public function run(): void
    {
        $sortOrder = 0;

        foreach (self::CATEGORIES as $slug => $definition) {
            $category = SkillCategory::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $definition['name'], 'sort_order' => $sortOrder++, 'is_published' => true],
            );

            foreach ($definition['technologies'] as $position => $name) {
                $technology = self::technology($name);

                Skill::query()->firstOrCreate(
                    ['skill_category_id' => $category->id, 'technology_id' => $technology->id],
                    ['name' => ['pt' => $name, 'en' => $name], 'sort_order' => $position, 'is_published' => true],
                );
            }
        }

        foreach (self::PROJECT_ONLY_TECHNOLOGIES as $name) {
            self::technology($name);
        }
    }

    public static function technology(string $name): Technology
    {
        return Technology::query()->firstOrCreate(
            ['slug' => Str::slug(str_replace('.', ' ', $name))],
            ['name' => $name],
        );
    }
}
