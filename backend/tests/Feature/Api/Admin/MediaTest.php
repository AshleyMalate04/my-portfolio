<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Media;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create(), 'web');
    }

    public function test_image_upload_is_stored_with_a_generated_safe_name(): void
    {
        $response = $this->postJson('/api/v1/admin/media', [
            'file' => UploadedFile::fake()->image('Fotografia Perfil.JPG', 640, 480),
            'alt' => ['pt' => 'Fotografia de perfil', 'en' => 'Profile photo'],
        ])->assertCreated()
            ->assertJsonPath('data.kind', 'image')
            ->assertJsonPath('data.width', 640)
            ->assertJsonPath('data.alt.en', 'Profile photo');

        $media = Media::query()->sole();

        $this->assertMatchesRegularExpression('#^media/\d{4}/\d{2}/[0-9a-z]{26}\.jpg$#', $media->path);
        $this->assertSame('Fotografia Perfil.JPG', $media->original_name);
        Storage::disk('public')->assertExists($media->path);
        $this->assertSame($media->id, $response->json('data.id'));
    }

    public function test_pdf_documents_are_accepted(): void
    {
        $pdf = UploadedFile::fake()->createWithContent('cv.pdf', "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

        $this->postJson('/api/v1/admin/media', ['file' => $pdf])
            ->assertCreated()
            ->assertJsonPath('data.kind', 'document')
            ->assertJsonPath('data.extension', 'pdf');
    }

    public function test_script_disguised_as_image_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/media', [
            'file' => UploadedFile::fake()->createWithContent('foto.jpg', '<?php echo "pwned"; ?>'),
        ])->assertUnprocessable()->assertJsonValidationErrors('file');

        $this->assertDatabaseCount('media', 0);
    }

    public function test_svg_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/media', [
            'file' => UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
        ])->assertUnprocessable();
    }

    public function test_oversized_images_are_rejected(): void
    {
        config(['portfolio.media.max_image_kb' => 1]);

        $this->postJson('/api/v1/admin/media', ['file' => UploadedFile::fake()->image('grande.png', 1200, 1200)->size(50)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_media_in_use_requires_confirmation_and_deletion_clears_references(): void
    {
        $upload = $this->postJson('/api/v1/admin/media', ['file' => UploadedFile::fake()->image('capa.png')])->assertCreated();
        $media = Media::query()->findOrFail($upload->json('data.id'));
        $project = Project::factory()->create(['cover_media_id' => $media->id]);

        $this->deleteJson("/api/v1/admin/media/{$media->id}")->assertStatus(409);
        Storage::disk('public')->assertExists($media->path);

        $this->deleteJson("/api/v1/admin/media/{$media->id}?force=1")->assertNoContent();

        $this->assertModelMissing($media);
        $this->assertNull($project->fresh()->cover_media_id);
        Storage::disk('public')->assertMissing($media->path);
    }

    public function test_guests_cannot_upload(): void
    {
        auth('web')->logout();

        $this->postJson('/api/v1/admin/media', ['file' => UploadedFile::fake()->image('a.png')])->assertUnauthorized();
    }
}
