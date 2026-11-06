<?php

namespace Database\Factories;

use App\Enums\MediaKind;
use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Registo de multimédia sem ficheiro físico (para testes de relações).
 *
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'disk' => 'public',
            'path' => 'media/test/'.Str::lower((string) Str::ulid()).'.jpg',
            'original_name' => 'imagem.jpg',
            'mime_type' => 'image/jpeg',
            'extension' => 'jpg',
            'size' => 1024,
            'width' => 800,
            'height' => 600,
            'kind' => MediaKind::Image,
            'checksum' => hash('sha256', Str::random()),
        ];
    }
}
