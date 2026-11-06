<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Media;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\Technology;

class ProjectManagementTest extends AdminTestCase
{
    public function test_full_project_lifecycle_is_reflected_in_the_public_api(): void
    {
        $react = Technology::query()->create(['name' => 'React', 'slug' => 'react']);
        $laravel = Technology::query()->create(['name' => 'Laravel', 'slug' => 'laravel']);
        $category = ProjectCategory::query()->create(['slug' => 'web', 'name' => ['pt' => 'Web']]);

        // Criar como rascunho.
        $id = $this->postJson('/api/v1/admin/projects', [
            'slug' => 'novo-sistema',
            'title' => ['pt' => 'Novo sistema', 'en' => 'New system'],
            'summary' => ['pt' => 'Resumo', 'en' => ''],
            'features' => ['pt' => ['Login', ' ', 'Relatórios'], 'en' => []],
            'project_status' => 'in_progress',
            'project_category_id' => $category->id,
            'technology_ids' => [$laravel->id, $react->id],
            'internal_notes' => 'Confirmar contribuição.',
        ])->assertCreated()
            ->assertJsonPath('data.publication_status', 'draft')
            ->assertJsonPath('data.technology_ids', [$laravel->id, $react->id])
            ->assertJsonPath('data.internal_notes', 'Confirmar contribuição.')
            // Traduções vazias e itens em branco são removidos.
            ->assertJsonPath('data.summary', ['pt' => 'Resumo'])
            ->assertJsonPath('data.features', ['pt' => ['Login', 'Relatórios']])
            ->json('data.id');

        $this->getJson('/api/v1/projects/novo-sistema')->assertNotFound();
        $this->getJson("/api/v1/admin/projects/{$id}/preview?lang=en")->assertOk()->assertJsonPath('data.title', 'New system');

        // Publicar (edição parcial).
        $this->patchJson("/api/v1/admin/projects/{$id}", ['publication_status' => 'published'])->assertOk();
        $this->assertNotNull(Project::query()->find($id)->published_at);

        $this->getJson('/api/v1/projects/novo-sistema')
            ->assertOk()
            ->assertJsonPath('data.technologies.0.slug', 'laravel')
            ->assertJsonPath('data.project_status', 'in_progress')
            ->assertJsonMissingPath('data.internal_notes');

        // Editar e destacar.
        $this->patchJson("/api/v1/admin/projects/{$id}", ['title' => ['pt' => 'Sistema renomeado'], 'is_featured' => true])->assertOk();
        $this->getJson('/api/v1/projects?featured=1')->assertJsonPath('data.0.title', 'Sistema renomeado');

        // Despublicar.
        $this->patchJson("/api/v1/admin/projects/{$id}", ['publication_status' => 'draft'])->assertOk();
        $this->getJson('/api/v1/projects/novo-sistema')->assertNotFound();

        // Eliminar.
        $this->deleteJson("/api/v1/admin/projects/{$id}")->assertOk();
        $this->assertDatabaseMissing('projects', ['id' => $id]);
        $this->assertDatabaseHas('technologies', ['id' => $react->id]);
    }

    public function test_validation_is_enforced_on_the_server(): void
    {
        Project::factory()->create(['slug' => 'existente']);

        $this->postJson('/api/v1/admin/projects', [
            'slug' => 'Existente Com Espaços',
            'title' => ['pt' => ''],
            'demo_url' => 'javascript:alert(1)',
            'started_at' => '2025-05-01',
            'ended_at' => '2024-01-01',
            'cover_media_id' => 999,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['slug', 'title.pt', 'demo_url', 'ended_at', 'cover_media_id']);

        $this->postJson('/api/v1/admin/projects', ['slug' => 'existente', 'title' => ['pt' => 'X']])
            ->assertJsonValidationErrors(['slug']);

        $id = Project::factory()->create()->id;
        $this->patchJson("/api/v1/admin/projects/{$id}", ['title' => ['pt' => '']])->assertJsonValidationErrors(['title.pt']);
    }

    public function test_cover_must_be_an_image_and_gallery_can_be_managed(): void
    {
        $project = Project::factory()->published()->create(['slug' => 'galeria']);
        $pdf = Media::factory()->create(['kind' => 'document', 'mime_type' => 'application/pdf', 'extension' => 'pdf']);
        [$a, $b] = Media::factory()->count(2)->create();

        $this->patchJson("/api/v1/admin/projects/{$project->id}", ['cover_media_id' => $pdf->id])
            ->assertJsonValidationErrors(['cover_media_id']);
        $this->patchJson("/api/v1/admin/projects/{$project->id}", ['cover_media_id' => $a->id])->assertOk();

        $this->postJson("/api/v1/admin/projects/{$project->id}/images", ['media_id' => $a->id, 'caption' => ['pt' => 'Ecrã A']])->assertCreated();
        $images = $this->postJson("/api/v1/admin/projects/{$project->id}/images", ['media_id' => $b->id])->assertCreated()->json('data.images');
        $this->postJson("/api/v1/admin/projects/{$project->id}/images", ['media_id' => $b->id])->assertJsonValidationErrors(['media_id']);

        $this->postJson("/api/v1/admin/projects/{$project->id}/images/reorder", ['ids' => [$images[1]['id'], $images[0]['id']]])
            ->assertOk()
            ->assertJsonPath('data.images.0.media_id', $b->id);

        $this->patchJson("/api/v1/admin/projects/{$project->id}/images/{$images[0]['id']}", ['caption' => ['pt' => 'Legenda nova']])->assertOk();

        $this->getJson('/api/v1/projects/galeria')
            ->assertJsonPath('data.cover.url', $a->url)
            ->assertJsonCount(2, 'data.gallery')
            ->assertJsonPath('data.gallery.1.caption', 'Legenda nova');

        $this->deleteJson("/api/v1/admin/projects/{$project->id}/images/{$images[1]['id']}")->assertOk();
        $this->getJson('/api/v1/projects/galeria')->assertJsonCount(1, 'data.gallery');
        $this->assertModelExists($b); // o ficheiro continua na biblioteca
    }

    public function test_listing_supports_search_filters_and_reordering(): void
    {
        $a = Project::factory()->create(['title' => ['pt' => 'Sistema de votação']]);
        $b = Project::factory()->published()->create(['title' => ['pt' => 'Plataforma de recursos']]);

        $this->getJson('/api/v1/admin/projects?q=VOTAÇÃO')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $a->id);
        $this->getJson('/api/v1/admin/projects?publication_status=published')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $b->id);

        $this->postJson('/api/v1/admin/projects/reorder', ['ids' => [$b->id, $a->id]])->assertOk();
        $this->getJson('/api/v1/admin/projects')->assertJsonPath('data.0.id', $b->id);

        $this->postJson('/api/v1/admin/projects/reorder', ['ids' => [$b->id, 9999]])->assertJsonValidationErrors(['ids']);
    }
}
