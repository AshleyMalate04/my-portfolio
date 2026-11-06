<?php

namespace App\Rules;

use App\Enums\MediaKind;
use App\Models\Media;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * O valor tem de ser o id de um ficheiro existente na biblioteca e do tipo esperado
 * (ex.: a fotografia tem de ser uma imagem, o CV um PDF).
 */
class MediaOfKind implements ValidationRule
{
    public function __construct(private readonly MediaKind $kind) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $media = is_numeric($value) ? Media::query()->find((int) $value) : null;

        if ($media === null) {
            $fail(__('admin.media_missing'));

            return;
        }

        if ($media->kind !== $this->kind) {
            $fail(__($this->kind === MediaKind::Image ? 'admin.media_must_be_image' : 'admin.media_must_be_document'));
        }
    }
}
