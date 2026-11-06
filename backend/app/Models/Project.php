<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasTranslations;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'project_category_id', 'slug', 'title', 'summary', 'description', 'problem', 'objective', 'solution',
    'contribution', 'challenges', 'features', 'results', 'project_status', 'publication_status', 'is_featured',
    'sort_order', 'started_at', 'ended_at', 'demo_url', 'repository_url', 'cover_media_id',
    'seo_title', 'seo_description', 'internal_notes', 'published_at',
])]
#[Hidden(['internal_notes'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, HasTranslations;

    protected array $translatable = [
        'title', 'summary', 'description', 'problem', 'objective', 'solution', 'contribution',
        'challenges', 'features', 'results', 'seo_title', 'seo_description',
    ];

    protected function casts(): array
    {
        return [
            'project_status' => ProjectStatus::class,
            'publication_status' => PublicationStatus::class,
            'is_featured' => 'boolean',
            'started_at' => 'date:Y-m-d',
            'ended_at' => 'date:Y-m-d',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ProjectCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProjectCategory::class, 'project_category_id');
    }

    /** @return BelongsTo<Media, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    /** @return BelongsToMany<Technology, $this> */
    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class)
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    /** @return HasMany<ProjectImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(ProjectImage::class)->orderBy('sort_order')->orderBy('id');
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where($this->qualifyColumn('publication_status'), PublicationStatus::Published);
    }

    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query->orderByDesc($this->qualifyColumn('is_featured'))
            ->orderBy($this->qualifyColumn('sort_order'))
            ->orderByDesc($this->qualifyColumn('published_at'))
            ->orderBy($this->qualifyColumn('id'));
    }

    public function isPublished(): bool
    {
        return $this->publication_status === PublicationStatus::Published;
    }
}
