<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'author_name', 'author_role', 'author_organization', 'quote', 'author_media_id',
    'consent_confirmed', 'is_published', 'sort_order',
])]
class Testimonial extends Model
{
    use HasTranslations, Publishable;

    protected array $translatable = ['author_role', 'quote'];

    protected function casts(): array
    {
        return [
            'consent_confirmed' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    /** @return BelongsTo<Media, $this> */
    public function authorPhoto(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'author_media_id');
    }

    /**
     * Visível publicamente apenas quando publicado e com autorização do autor.
     */
    #[Scope]
    protected function visible(Builder $query): void
    {
        $query->published()->where('consent_confirmed', true);
    }
}
