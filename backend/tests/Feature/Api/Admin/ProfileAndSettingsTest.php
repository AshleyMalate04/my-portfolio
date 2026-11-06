<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Media;
use App\Models\Profile;
use App\Models\SiteSetting;

class ProfileAndSettingsTest extends AdminTestCase
{
    public function test_profile_changes_are_persisted_and_visible_on_the_public_site(): void
    {
        Profile::query()->create(['full_name' => 'Ashley da Amena Mario Malate']);
        $photo = Media::factory()->create();
        $cv = Media::factory()->create(['kind' => 'document', 'mime_type' => 'application/pdf', 'extension' => 'pdf']);

        $this->putJson('/api/v1/admin/profile', [
            'headline' => ['pt' => 'Desenvolvedora full stack', 'en' => 'Full-stack developer'],
            'hero_phrases' => ['pt' => ['Sistemas claros.'], 'en' => []],
            'public_email' => 'ashley@example.com',
            'whatsapp' => '+258 84 000 0000',
            'availability_status' => 'available',
            'show_availability' => true,
            'photo_media_id' => $photo->id,
            'cv_media_id' => $cv->id,
        ])->assertOk()->assertJsonPath('data.headline.en', 'Full-stack developer');

        $this->getJson('/api/v1/profile?lang=en')
            ->assertJsonPath('data.headline', 'Full-stack developer')
            ->assertJsonPath('data.hero_phrases', ['Sistemas claros.'])
            ->assertJsonPath('data.public_email', 'ashley@example.com')
            ->assertJsonPath('data.availability.status', 'available')
            ->assertJsonPath('data.photo.url', $photo->url)
            ->assertJsonPath('data.cv_url', $cv->url);
    }

    public function test_profile_media_types_and_contacts_are_validated(): void
    {
        Profile::query()->create(['full_name' => 'Ashley']);
        $image = Media::factory()->create();

        $this->putJson('/api/v1/admin/profile', [
            'cv_media_id' => $image->id,
            'public_email' => 'invalido',
            'phone' => '<script>',
            'full_name' => '',
        ])->assertUnprocessable()->assertJsonValidationErrors(['cv_media_id', 'public_email', 'phone', 'full_name']);
    }

    public function test_settings_are_updated_merged_and_published(): void
    {
        SiteSetting::query()->create(['key' => 'sections', 'value' => ['about' => true, 'testimonials' => false]]);
        $og = Media::factory()->create();

        $this->putJson('/api/v1/admin/settings', [
            'site_name' => 'Ashley Malate',
            'brand_wordmark' => 'ashley',
            'seo_title' => ['pt' => 'Título SEO', 'en' => 'SEO title'],
            'og_image_media_id' => $og->id,
            'sections' => ['testimonials' => true],
            'chave_inventada' => 'ignorada',
        ])->assertOk()->assertJsonPath('data.values.sections', ['about' => true, 'testimonials' => true]);

        $this->assertDatabaseMissing('site_settings', ['key' => 'chave_inventada']);

        $this->getJson('/api/v1/site?lang=en')
            ->assertJsonPath('data.settings.site_name', 'Ashley Malate')
            ->assertJsonPath('data.settings.seo_title', 'SEO title')
            ->assertJsonPath('data.settings.og_image.url', $og->url)
            ->assertJsonPath('data.settings.sections.testimonials', true);
    }

    public function test_settings_reject_unknown_sections_and_wrong_media(): void
    {
        $pdf = Media::factory()->create(['kind' => 'document', 'mime_type' => 'application/pdf', 'extension' => 'pdf']);

        $this->putJson('/api/v1/admin/settings', [
            'sections' => ['pagina_secreta' => true],
            'favicon_media_id' => $pdf->id,
            'site_name' => '',
        ])->assertJsonValidationErrors(['sections', 'favicon_media_id', 'site_name']);
    }

    public function test_contact_headline_is_configurable_and_removed_settings_are_rejected(): void
    {
        $this->putJson('/api/v1/admin/settings', [
            'contact_headline' => ['pt' => 'Vamos construir algo juntos.', 'en' => "Let's build something together."],
            // Definições do antigo formulário e rodapé já não são aceites.
            'contact_form' => true,
            'footer_note' => ['pt' => 'x'],
        ])->assertOk();

        $this->getJson('/api/v1/site?lang=en')
            ->assertJsonPath('data.settings.contact_headline', "Let's build something together.")
            ->assertJsonMissingPath('data.settings.contact_form')
            ->assertJsonMissingPath('data.settings.footer_note');
    }
}
