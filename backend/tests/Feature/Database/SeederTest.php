<?php

namespace Tests\Feature\Database;

use App\Enums\PublicationStatus;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Service;
use App\Models\Skill;
use App\Models\Technology;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_content_is_safe_and_idempotent(): void
    {
        $this->seed();
        Profile::query()->first()->update(['location' => 'Editado no backoffice']);
        $this->seed();

        $this->assertSame(0, User::query()->count(), 'Os seeders não devem criar contas nem credenciais.');
        $this->assertSame(1, Profile::query()->count());
        $this->assertSame('Editado no backoffice', Profile::query()->first()->location);
        $this->assertSame(6, Project::query()->count());
        $this->assertSame(6, Project::query()->where('publication_status', PublicationStatus::Draft)->count());
        $this->assertSame(0, Service::query()->published()->count());

        // Tecnologias associadas apenas a projectos não aparecem como competências confirmadas.
        $express = Technology::query()->where('slug', 'express')->sole();
        $this->assertFalse(Skill::query()->where('technology_id', $express->id)->exists());
        $this->assertSame(7, Project::query()->where('slug', 'confylar')->sole()->technologies()->count());
    }

    public function test_public_api_does_not_expose_seeded_drafts(): void
    {
        $this->seed();

        $this->getJson('/api/v1/projects')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/projects/confylar')->assertNotFound();
        $this->getJson('/api/v1/technologies')->assertJsonMissing(['slug' => 'drizzle-orm']);
    }
}
