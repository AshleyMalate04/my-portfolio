<?php

namespace App\Models;

use App\Enums\AvailabilityStatus;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Perfil profissional (registo único). Use Profile::current() para o obter.
 */
#[Fillable([
    'full_name', 'display_name', 'headline', 'short_bio', 'long_bio', 'hero_phrases',
    'interests', 'approach', 'goals', 'location', 'public_email', 'phone', 'whatsapp',
    'availability_status', 'availability_note', 'show_availability',
    'photo_media_id', 'hero_media_id', 'cv_media_id',
])]
class Profile extends Model
{
    use HasTranslations;

    protected array $translatable = [
        'headline', 'short_bio', 'long_bio', 'hero_phrases', 'interests', 'approach', 'goals', 'availability_note',
    ];

    protected function casts(): array
    {
        return [
            'availability_status' => AvailabilityStatus::class,
            'show_availability' => 'boolean',
        ];
    }

    public static function current(): ?self
    {
        return static::query()->with(['photo', 'heroImage', 'cv'])->oldest('id')->first();
    }

    /** @return BelongsTo<Media, $this> */
    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }

    /** @return BelongsTo<Media, $this> */
    public function heroImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'hero_media_id');
    }

    /** @return BelongsTo<Media, $this> */
    public function cv(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cv_media_id');
    }
}
