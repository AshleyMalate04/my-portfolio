<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Skill;
use App\Models\SkillCategory;

/** Competências, serviços, percurso, redes sociais e testemunhos geridos pela API administrativa. */
class ContentManagementTest extends AdminTestCase
{
    public function test_services_can_be_created_published_hidden_and_deleted(): void
    {
        $id = $this->postJson('/api/v1/admin/services', [
            'slug' => 'apis',
            'title' => ['pt' => 'APIs', 'en' => 'APIs'],
            'icon' => 'server',
        ])->assertCreated()->assertJsonPath('data.is_published', false)->json('data.id');

        $this->getJson('/api/v1/services')->assertJsonCount(0, 'data');

        $this->patchJson("/api/v1/admin/services/{$id}", ['is_published' => true])->assertOk();
        $this->getJson('/api/v1/services')->assertJsonPath('data.0.title', 'APIs');

        $this->patchJson("/api/v1/admin/services/{$id}", ['icon' => 'virus'])->assertJsonValidationErrors(['icon']);

        $this->deleteJson("/api/v1/admin/services/{$id}")->assertOk();
        $this->assertDatabaseCount('services', 0);
    }

    public function test_skills_are_managed_and_reordered_within_their_category(): void
    {
        $frontend = $this->postJson('/api/v1/admin/skill-categories', ['slug' => 'frontend', 'name' => ['pt' => 'Frontend'], 'is_published' => true])
            ->assertCreated()->json('data.id');
        $backend = SkillCategory::query()->create(['slug' => 'backend', 'name' => ['pt' => 'Backend'], 'is_published' => true]);

        $react = $this->postJson('/api/v1/admin/skills', ['skill_category_id' => $frontend, 'name' => ['pt' => 'React'], 'is_published' => true])->json('data.id');
        $vue = $this->postJson('/api/v1/admin/skills', ['skill_category_id' => $frontend, 'name' => ['pt' => 'Vue'], 'is_published' => true])->json('data.id');
        $php = Skill::query()->create(['skill_category_id' => $backend->id, 'name' => ['pt' => 'PHP'], 'is_published' => true]);

        $this->postJson('/api/v1/admin/skills/reorder', ['skill_category_id' => $frontend, 'ids' => [$vue, $react]])->assertOk();
        // Não é possível misturar competências de outra categoria.
        $this->postJson('/api/v1/admin/skills/reorder', ['skill_category_id' => $frontend, 'ids' => [$vue, $php->id]])->assertJsonValidationErrors(['ids']);

        // A categoria "backend" (criada directamente) tem sort_order 0 e aparece primeiro.
        $this->getJson('/api/v1/skills')->assertJsonPath('data.1.slug', 'frontend')->assertJsonPath('data.1.skills.0.name', 'Vue');

        $this->deleteJson("/api/v1/admin/skill-categories/{$frontend}")->assertJsonValidationErrors(['skills']);
        $this->assertDatabaseHas('skill_categories', ['id' => $frontend]);
    }

    public function test_journey_entries_validate_dates_and_appear_publicly_when_published(): void
    {
        $this->postJson('/api/v1/admin/experiences', [
            'organization' => 'Empresa',
            'role' => ['pt' => 'Estagiária'],
            'employment_type' => 'internship',
            'started_at' => '2025-06-01',
            'ended_at' => '2025-01-01',
        ])->assertJsonValidationErrors(['ended_at']);

        $this->postJson('/api/v1/admin/experiences', [
            'organization' => 'Empresa',
            'role' => ['pt' => 'Estagiária', 'en' => 'Intern'],
            'employment_type' => 'internship',
            'started_at' => '2025-01-01',
            'is_published' => true,
        ])->assertCreated()->assertJsonPath('data.started_at', '2025-01-01');

        $this->postJson('/api/v1/admin/certifications', [
            'kind' => 'course',
            'name' => ['pt' => 'Curso'],
            'issuer' => 'Entidade',
            'credential_url' => 'https://example.com/c',
            'is_published' => true,
        ])->assertCreated();

        $this->getJson('/api/v1/journey?lang=en')
            ->assertJsonPath('data.experience.0.role', 'Intern')
            ->assertJsonCount(1, 'data.certifications');
    }

    public function test_social_links_only_accept_safe_urls(): void
    {
        $this->postJson('/api/v1/admin/social-links', ['platform' => 'github', 'url' => 'javascript:alert(1)'])->assertJsonValidationErrors(['url']);
        $this->postJson('/api/v1/admin/social-links', ['platform' => 'email', 'url' => 'https://example.com'])->assertJsonValidationErrors(['url']);
        $this->postJson('/api/v1/admin/social-links', ['platform' => 'email', 'url' => 'mailto:ashley@example.com'])->assertCreated();
        $this->postJson('/api/v1/admin/social-links', ['platform' => 'linkedin', 'label' => 'LinkedIn', 'url' => 'https://www.linkedin.com/in/exemplo'])->assertCreated();

        $this->getJson('/api/v1/social-links')->assertJsonCount(2, 'data');
    }

    public function test_testimonials_require_consent_before_publication(): void
    {
        $this->postJson('/api/v1/admin/testimonials', [
            'author_name' => 'Pessoa',
            'quote' => ['pt' => 'Excelente trabalho.'],
            'is_published' => true,
        ])->assertJsonValidationErrors(['is_published']);

        $id = $this->postJson('/api/v1/admin/testimonials', [
            'author_name' => 'Pessoa',
            'quote' => ['pt' => 'Excelente trabalho.'],
        ])->assertCreated()->json('data.id');

        $this->patchJson("/api/v1/admin/testimonials/{$id}", ['is_published' => true])->assertJsonValidationErrors(['is_published']);
        $this->patchJson("/api/v1/admin/testimonials/{$id}", ['consent_confirmed' => true, 'is_published' => true])->assertOk();

        $this->getJson('/api/v1/testimonials')->assertJsonPath('data.0.author_name', 'Pessoa');
    }

    public function test_technologies_and_categories_can_be_managed(): void
    {
        $this->postJson('/api/v1/admin/technologies', ['name' => 'Svelte', 'slug' => 'svelte', 'website_url' => 'https://svelte.dev'])->assertCreated();
        $this->postJson('/api/v1/admin/technologies', ['name' => 'Svelte', 'slug' => 'svelte-2'])->assertJsonValidationErrors(['name']);
        $this->getJson('/api/v1/admin/technologies?q=svel')->assertJsonCount(1, 'data');

        $this->postJson('/api/v1/admin/project-categories', ['slug' => 'mobile', 'name' => ['pt' => 'Móvel', 'en' => 'Mobile']])
            ->assertCreated()->assertJsonPath('data.sort_order', 1);
    }
}
