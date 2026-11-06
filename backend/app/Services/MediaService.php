<?php

namespace App\Services;

use App\Enums\MediaKind;
use App\Models\Certification;
use App\Models\Media;
use App\Models\Profile;
use App\Models\Project;
use App\Models\ProjectImage;
use App\Models\SiteSetting;
use App\Models\Testimonial;
use App\Models\User;
use App\Support\Translatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Throwable;

/**
 * Armazenamento seguro de ficheiros carregados no backoffice.
 *
 * - O tipo é determinado pelo conteúdo real do ficheiro (finfo), nunca pelo nome enviado.
 * - O nome guardado é gerado (ULID) com uma extensão derivada do tipo, impedindo .php, .html, etc.
 * - Se a gravação na base de dados falhar, o ficheiro já escrito é removido.
 * - Ficheiros físicos só são apagados depois de a transacção confirmar a alteração.
 */
class MediaService
{
    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/avif' => 'avif',
        'application/pdf' => 'pdf',
    ];

    /** Definições do site que guardam ids de ficheiros. */
    private const SETTING_KEYS = ['logo_media_id', 'favicon_media_id', 'og_image_media_id'];

    /** @param array<string, string>|null $alt */
    public function store(UploadedFile $file, ?User $uploader = null, ?array $alt = null): Media
    {
        $stored = $this->writeFile($file);

        try {
            return Media::query()->create([
                ...$stored,
                'original_name' => $this->originalName($file),
                'alt' => Translatable::clean($alt),
                'uploaded_by' => $uploader?->id,
            ]);
        } catch (Throwable $e) {
            Storage::disk($stored['disk'])->delete($stored['path']);

            throw $e;
        }
    }

    /**
     * Substitui o conteúdo de um ficheiro mantendo o mesmo registo (e portanto todas as referências:
     * perfil, capas, galerias...). O novo ficheiro tem de ser do mesmo tipo (imagem ↔ imagem, PDF ↔ PDF).
     */
    public function replace(Media $media, UploadedFile $file): Media
    {
        if ($this->kindFor((string) $file->getMimeType()) !== $media->kind) {
            throw ValidationException::withMessages(['file' => __('admin.media_kind_mismatch')]);
        }

        $stored = $this->writeFile($file);
        $oldDisk = $media->disk;
        $oldPath = $media->path;

        try {
            DB::transaction(function () use ($media, $stored, $file) {
                $media->fill([...$stored, 'original_name' => $this->originalName($file)])->save();
            });
        } catch (Throwable $e) {
            Storage::disk($stored['disk'])->delete($stored['path']);

            throw $e;
        }

        DB::afterCommit(fn () => Storage::disk($oldDisk)->delete($oldPath));

        return $media;
    }

    public function kindFor(string $mime): MediaKind
    {
        return match (true) {
            in_array($mime, config('portfolio.media.image_mimes'), true) => MediaKind::Image,
            in_array($mime, config('portfolio.media.document_mimes'), true) => MediaKind::Document,
            default => throw new InvalidArgumentException("Tipo de ficheiro não suportado: {$mime}"),
        };
    }

    public function isInUse(Media $media): bool
    {
        return $this->usage($media) !== [];
    }

    /**
     * Onde o ficheiro está a ser usado, para o administrador decidir antes de eliminar.
     *
     * @return list<array{type: string, id: int|null, field: string, label: string}>
     */
    public function usage(Media $media): array
    {
        return $this->usageFor(collect([$media->id]))[$media->id] ?? [];
    }

    /**
     * Utilizações de vários ficheiros com um número fixo de consultas (para listagens).
     *
     * @param  Collection<int, int>  $ids
     * @return array<int, list<array{type: string, id: int|null, field: string, label: string}>>
     */
    public function usageFor(Collection $ids): array
    {
        $usage = [];
        $add = function (?int $mediaId, string $type, ?int $id, string $field, string $label) use (&$usage) {
            if ($mediaId !== null) {
                $usage[$mediaId][] = ['type' => $type, 'id' => $id, 'field' => $field, 'label' => $label];
            }
        };

        if ($ids->isEmpty()) {
            return [];
        }

        foreach (Profile::query()->get(['id', 'full_name', 'photo_media_id', 'hero_media_id', 'cv_media_id']) as $profile) {
            foreach (['photo_media_id' => 'photo', 'hero_media_id' => 'hero_image', 'cv_media_id' => 'cv'] as $column => $field) {
                if ($ids->contains($profile->{$column})) {
                    $add($profile->{$column}, 'profile', $profile->id, $field, $profile->full_name);
                }
            }
        }

        Project::query()->whereIn('cover_media_id', $ids)->get(['id', 'title', 'cover_media_id'])
            ->each(fn (Project $p) => $add($p->cover_media_id, 'project', $p->id, 'cover', (string) $p->translate('title', 'pt')));

        ProjectImage::query()->whereIn('media_id', $ids)->with('project:id,title')->get()
            ->each(fn (ProjectImage $i) => $add($i->media_id, 'project', $i->project_id, 'gallery', (string) $i->project?->translate('title', 'pt')));

        Certification::query()->whereIn('document_media_id', $ids)->get(['id', 'name', 'document_media_id'])
            ->each(fn (Certification $c) => $add($c->document_media_id, 'certification', $c->id, 'document', (string) $c->translate('name', 'pt')));

        Testimonial::query()->whereIn('author_media_id', $ids)->get(['id', 'author_name', 'author_media_id'])
            ->each(fn (Testimonial $t) => $add($t->author_media_id, 'testimonial', $t->id, 'author_photo', $t->author_name));

        SiteSetting::query()->whereIn('key', self::SETTING_KEYS)->get()
            ->each(fn (SiteSetting $s) => is_int($s->value) && $ids->contains($s->value)
                ? $add($s->value, 'settings', null, Str::beforeLast($s->key, '_media_id'), $s->key)
                : null);

        return $usage;
    }

    /**
     * Elimina o registo e o ficheiro. As chaves estrangeiras limpam as referências (SET NULL / CASCADE);
     * as definições do site, que não têm chave estrangeira, são limpas aqui.
     */
    public function delete(Media $media): void
    {
        DB::transaction(function () use ($media) {
            SiteSetting::query()->whereIn('key', self::SETTING_KEYS)->get()
                ->filter(fn (SiteSetting $s) => $s->value === $media->id)
                ->each(fn (SiteSetting $s) => $s->update(['value' => null]));

            // O ficheiro físico é removido pelo evento "deleted" do modelo, após o commit.
            $media->delete();
        });
    }

    /** @return array{disk: string, path: string, mime_type: string, extension: string, size: int, width: int|null, height: int|null, kind: MediaKind, checksum: string} */
    private function writeFile(UploadedFile $file): array
    {
        $mime = (string) $file->getMimeType();
        $kind = $this->kindFor($mime);
        $extension = self::EXTENSIONS[$mime];
        $disk = config('portfolio.media.disk');
        $directory = config('portfolio.media.directory').'/'.now()->format('Y/m');

        [$width, $height] = $kind === MediaKind::Image ? $this->dimensions($file) : [null, null];

        $path = $file->storeAs($directory, Str::lower((string) Str::ulid()).'.'.$extension, $disk);

        if ($path === false) {
            throw new \RuntimeException('Não foi possível gravar o ficheiro no armazenamento.');
        }

        return [
            'disk' => $disk,
            'path' => $path,
            'mime_type' => $mime,
            'extension' => $extension,
            'size' => (int) $file->getSize(),
            'width' => $width,
            'height' => $height,
            'kind' => $kind,
            'checksum' => hash_file('sha256', $file->getRealPath()),
        ];
    }

    private function originalName(UploadedFile $file): string
    {
        return Str::limit(basename($file->getClientOriginalName()), 250, '');
    }

    /** @return array{0: int|null, 1: int|null} */
    private function dimensions(UploadedFile $file): array
    {
        $size = @getimagesize($file->getRealPath());

        return $size === false ? [null, null] : [$size[0], $size[1]];
    }
}
