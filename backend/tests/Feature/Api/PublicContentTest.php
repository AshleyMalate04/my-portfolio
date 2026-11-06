<?php

namespace Tests\Feature\Api;

use App\Enums\AvailabilityStatus;
use App\Models\Media;
use App\Models\Profile;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\SiteSetting;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Technology;
use App\Models\Testimonial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_returns_404_when_not_configured(): void
    {
        $this->getJson('/api/v1/profile')
            ->assertNotFound()
            ->assertExactJson(['message' => 'O recurso pedido não foi encontrado.']);
    }

    public function test_profile_is_translated_and_falls_back_to_portuguese(): void
    {
        Profile::query()->create([
            'full_name' => 'Ashley da Amena Mario Malate',
            'headline' => ['pt' => 'Desenvolvedora de software', 'en' => 'Software developer'],
            'short_bio' => ['pt' => 'Apenas em português.'],
        ]);

        $this->getJson('/api/v1/profile?lang=en')
            ->assertOk()
            ->assertHeader('Content-Language', 'en')
            ->assertJsonPath('data.headline', 'Software developer')
            ->assertJsonPath('data.short_bio', 'Apenas em português.');

        // O idioma vem apenas de ?lang=; idiomas não suportados usam o português.
        $this->getJson('/api/v1/profile?lang=fr', ['Accept-Language' => 'en-GB,en;q=0.9'])
            ->assertHeader('Content-Language', 'pt')
            ->assertJsonPath('data.headline', 'Desenvolvedora de software');
    }

    public function test_availability_is_only_exposed_when_enabled(): void
    {
        $profile = Profile::query()->create([
            'full_name' => 'Ashley',
            'availability_status' => AvailabilityStatus::OpenToOpportunities,
            'show_availability' => false,
        ]);

        $this->getJson('/api/v1/profile')->assertJsonMissingPath('data.availability');

        $profile->update(['show_availability' => true]);

        $this->getJson('/api/v1/profile')->assertJsonPath('data.availability.status', 'open_to_opportunities');
    }

    public function test_only_published_projects_are_listed_without_private_fields(): void
    {
        Project::factory()->published()->create(['slug' => 'publicado', 'internal_notes' => 'segredo']);
        Project::factory()->create(['slug' => 'rascunho']);

        $response = $this->getJson('/api/v1/projects')->assertOk();

        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'publicado')
            ->assertJsonPath('meta.total', 1);

        $this->assertStringNotContainsString('segredo', $response->getContent());
        $this->assertStringNotContainsString('internal_notes', $response->getContent());
    }

    public function test_project_detail_is_available_only_when_published(): void
    {
        $cover = Media::factory()->create();
        $project = Project::factory()->published()->create([
            'slug' => 'sisaep',
            'features' => ['pt' => ['Submissão', 'Avaliação']],
            'cover_media_id' => $cover->id,
        ]);
        $project->technologies()->attach(Technology::query()->create(['name' => 'Laravel', 'slug' => 'laravel'])->id);
        Project::factory()->create(['slug' => 'privado']);

        $this->getJson('/api/v1/projects/sisaep')
            ->assertOk()
            ->assertJsonPath('data.features', ['Submissão', 'Avaliação'])
            ->assertJsonPath('data.technologies.0.slug', 'laravel')
            ->assertJsonPath('data.cover.width', 800)
            ->assertJsonPath('data.seo.title', $project->translate('title'));

        $this->getJson('/api/v1/projects/privado')->assertNotFound();
        $this->getJson('/api/v1/projects/inexistente')->assertNotFound();
    }

    public function test_projects_can_be_filtered_by_category_technology_and_featured(): void
    {
        $category = ProjectCategory::query()->create(['slug' => 'web', 'name' => ['pt' => 'Web']]);
        $react = Technology::query()->create(['name' => 'React', 'slug' => 'react']);

        $a = Project::factory()->published()->create(['slug' => 'a', 'project_category_id' => $category->id, 'is_featured' => true]);
        $a->technologies()->attach($react->id);
        Project::factory()->published()->create(['slug' => 'b']);

        $this->getJson('/api/v1/projects?category=web')->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'a');
        $this->getJson('/api/v1/projects?technology=react')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/projects?featured=1')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/projects')->assertJsonCount(2, 'data')->assertJsonPath('data.0.slug', 'a');
        $this->getJson('/api/v1/projects?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');

        $this->getJson('/api/v1/project-categories')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.projects_count', 1);
    }

    public function test_skills_and_technologies_only_include_published_content(): void
    {
        $category = SkillCategory::query()->create(['slug' => 'frontend', 'name' => ['pt' => 'Frontend'], 'is_published' => true]);
        $react = Technology::query()->create(['name' => 'React', 'slug' => 'react']);
        Technology::query()->create(['name' => 'Express', 'slug' => 'express']);

        Skill::query()->create(['skill_category_id' => $category->id, 'technology_id' => $react->id, 'name' => ['pt' => 'React'], 'is_published' => true]);
        Skill::query()->create(['skill_category_id' => $category->id, 'name' => ['pt' => 'Não confirmada'], 'is_published' => false]);

        $this->getJson('/api/v1/skills')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonCount(1, 'data.0.skills')
            ->assertJsonPath('data.0.skills.0.technology.slug', 'react');

        $this->getJson('/api/v1/technologies')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'react');
    }

    public function test_testimonials_require_publication_and_consent(): void
    {
        Testimonial::query()->create(['author_name' => 'Sem consentimento', 'quote' => ['pt' => 'Texto'], 'is_published' => true, 'consent_confirmed' => false]);
        Testimonial::query()->create(['author_name' => 'Autorizado', 'quote' => ['pt' => 'Texto'], 'is_published' => true, 'consent_confirmed' => true]);

        $this->getJson('/api/v1/testimonials')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.author_name', 'Autorizado');
    }

    public function test_site_settings_only_expose_public_values(): void
    {
        SiteSetting::query()->create(['key' => 'site_tagline', 'value' => ['pt' => 'Portfólio', 'en' => 'Portfolio']]);
        SiteSetting::query()->create(['key' => 'interno', 'value' => 'privado', 'is_public' => false]);

        $this->getJson('/api/v1/site?lang=en')
            ->assertOk()
            ->assertJsonPath('data.settings.site_tagline', 'Portfolio')
            ->assertJsonMissingPath('data.settings.interno')
            ->assertJsonPath('data.available_locales', ['pt', 'en']);
    }

    public function test_empty_collections_return_empty_data(): void
    {
        foreach (['services', 'process-steps', 'social-links', 'testimonials', 'skills'] as $endpoint) {
            $this->getJson("/api/v1/{$endpoint}")->assertOk()->assertExactJson(['data' => []]);
        }

        $this->getJson('/api/v1/journey')
            ->assertOk()
            ->assertExactJson(['data' => ['education' => [], 'experience' => [], 'certifications' => []]]);
    }
}
