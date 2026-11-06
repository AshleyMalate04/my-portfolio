<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Media;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SiteSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaLibraryTest extends AdminTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function upload(UploadedFile $file): Media
    {
        return Media::query()->findOrFail($this->postJson('/api/v1/admin/media', ['file' => $file])->assertCreated()->json('data.id'));
    }

    public function test_replacing_a_file_keeps_references_and_removes_the_old_file(): void
    {
        $media = $this->upload(UploadedFile::fake()->image('antiga.png', 400, 300));
        $oldPath = $media->path;
        $project = Project::factory()->published()->create(['slug' => 'com-capa', 'cover_media_id' => $media->id]);

        $this->postJson("/api/v1/admin/media/{$media->id}/replace", ['file' => UploadedFile::fake()->image('nova.jpg', 800, 600)])
            ->assertOk()
            ->assertJsonPath('data.id', $media->id)
            ->assertJsonPath('data.width', 800)
            ->assertJsonPath('data.original_name', 'nova.jpg')
            ->assertJsonPath('data.usage.0.type', 'project');

        $media->refresh();
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($media->path);
        $this->assertSame($media->id, $project->fresh()->cover_media_id);
        $this->getJson('/api/v1/projects/com-capa')->assertJsonPath('data.cover.url', $media->url);
    }

    public function test_replacement_must_keep_the_same_kind(): void
    {
        $media = $this->upload(UploadedFile::fake()->image('foto.png'));

        $this->postJson("/api/v1/admin/media/{$media->id}/replace", [
            'file' => UploadedFile::fake()->createWithContent('cv.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertJsonValidationErrors(['file']);
    }

    public function test_usage_is_reported_and_forced_deletion_clears_every_reference(): void
    {
        $media = $this->upload(UploadedFile::fake()->image('logo.png'));
        $profile = Profile::query()->create(['full_name' => 'Ashley', 'photo_media_id' => $media->id]);
        SiteSetting::query()->create(['key' => 'og_image_media_id', 'value' => $media->id]);

        $this->getJson('/api/v1/admin/media')->assertJsonCount(2, 'data.0.usage');

        $this->deleteJson("/api/v1/admin/media/{$media->id}")
            ->assertStatus(409)
            ->assertJsonCount(2, 'usage');

        $this->deleteJson("/api/v1/admin/media/{$media->id}?force=1")->assertNoContent();

        $this->assertNull($profile->fresh()->photo_media_id);
        $this->assertNull(SiteSetting::query()->where('key', 'og_image_media_id')->value('value'));
        Storage::disk('public')->assertMissing($media->path);
    }

    public function test_alt_text_search_and_kind_filter(): void
    {
        $image = $this->upload(UploadedFile::fake()->image('retrato.png'));
        $this->upload(UploadedFile::fake()->createWithContent('curriculo.pdf', "%PDF-1.4\n%%EOF"));

        $this->patchJson("/api/v1/admin/media/{$image->id}", ['alt' => ['pt' => 'Fotografia de perfil', 'en' => 'Profile photo']])
            ->assertJsonPath('data.alt.en', 'Profile photo');

        $this->getJson('/api/v1/admin/media?kind=document')->assertJsonCount(1, 'data')->assertJsonPath('data.0.extension', 'pdf');
        $this->getJson('/api/v1/admin/media?q=perfil')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $image->id);
    }
}
