<?php

namespace Tests\Feature\Api;

use App\Models\Media;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Service;
use App\Models\SiteSetting;
use App\Models\Testimonial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeAndSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_aggregates_only_published_content(): void
    {
        Profile::query()->create(['full_name' => 'Ashley da Amena Mario Malate', 'headline' => ['pt' => 'Desenvolvedora', 'en' => 'Developer']]);
        Project::factory()->published()->count(7)->create();
        Project::factory()->create(['slug' => 'rascunho']);
        Service::query()->create(['slug' => 'publicado', 'title' => ['pt' => 'Publicado'], 'is_published' => true]);
        Service::query()->create(['slug' => 'oculto', 'title' => ['pt' => 'Oculto'], 'is_published' => false]);
        Testimonial::query()->create(['author_name' => 'Sem autorização', 'quote' => ['pt' => 'x'], 'is_published' => true]);

        $response = $this->getJson('/api/v1/home?lang=en')->assertOk();

        $response
            ->assertJsonPath('data.locale', 'en')
            ->assertJsonPath('data.profile.headline', 'Developer')
            ->assertJsonCount(6, 'data.projects.items')
            ->assertJsonPath('data.projects.total', 7)
            ->assertJsonCount(1, 'data.services')
            ->assertJsonCount(0, 'data.testimonials')
            ->assertJsonStructure(['data' => ['settings', 'skills', 'journey' => ['education', 'experience', 'certifications'], 'process_steps', 'social_links', 'project_categories']]);

        $this->assertStringNotContainsString('rascunho', $response->getContent());
    }

    public function test_home_works_before_the_profile_exists(): void
    {
        $this->getJson('/api/v1/home')->assertOk()->assertJsonPath('data.profile', null);
    }

    public function test_media_settings_are_resolved_to_urls(): void
    {
        $image = Media::factory()->create();
        SiteSetting::query()->create(['key' => 'og_image_media_id', 'value' => $image->id]);

        $this->getJson('/api/v1/site')
            ->assertJsonPath('data.settings.og_image.url', $image->url)
            ->assertJsonMissingPath('data.settings.og_image_media_id');
    }

    public function test_public_reads_are_cacheable_without_cookies(): void
    {
        $response = $this->getJson('/api/v1/home');

        $this->assertStringContainsString('public', (string) $response->headers->get('Cache-Control'));
        $this->assertSame([], $response->headers->getCookies());
    }

    public function test_project_detail_includes_objective_and_challenges(): void
    {
        Project::factory()->published()->create([
            'slug' => 'detalhe',
            'objective' => ['pt' => 'Objectivo', 'en' => 'Objective'],
            'challenges' => ['pt' => 'Desafios'],
        ]);

        $this->getJson('/api/v1/projects/detalhe?lang=en')
            ->assertJsonPath('data.objective', 'Objective')
            ->assertJsonPath('data.challenges', 'Desafios');
    }

    public function test_sitemap_lists_published_projects_in_both_languages(): void
    {
        config(['portfolio.frontend_url' => 'https://exemplo.co.mz']);
        Project::factory()->published()->create(['slug' => 'publicado']);
        Project::factory()->create(['slug' => 'rascunho']);

        $response = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $xml = $response->getContent();

        $this->assertStringContainsString('<loc>https://exemplo.co.mz/</loc>', $xml);
        $this->assertStringContainsString('<loc>https://exemplo.co.mz/en/projects</loc>', $xml);
        $this->assertStringContainsString('<loc>https://exemplo.co.mz/projectos/publicado</loc>', $xml);
        $this->assertStringContainsString('hreflang="en" href="https://exemplo.co.mz/en/projects/publicado"', $xml);
        $this->assertStringNotContainsString('rascunho', $xml);
        $this->assertNotFalse(simplexml_load_string($xml), 'O sitemap tem de ser XML válido.');
    }

    public function test_robots_blocks_everything_outside_production_and_admin_in_production(): void
    {
        $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /', false)->assertSee('Sitemap:', false);

        $this->app['env'] = 'production';
        $this->get('/robots.txt')->assertSee('Disallow: /admin', false);
    }
}
