<?php

namespace App\Models;

use App\Enums\CertificationKind;
use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'kind', 'name', 'issuer', 'description', 'issued_at', 'expires_at',
    'credential_id', 'credential_url', 'document_media_id', 'sort_order', 'is_published',
])]
class Certification extends Model
{
    use HasTranslations, Publishable;

    protected array $translatable = ['name', 'description'];

    protected function casts(): array
    {
        return [
            'kind' => CertificationKind::class,
            'issued_at' => 'date:Y-m-d',
            'expires_at' => 'date:Y-m-d',
            'is_published' => 'boolean',
        ];
    }

    /** @return BelongsTo<Media, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'document_media_id');
    }
}
