<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'website_url'])]
class Technology extends Model
{
    /** @return BelongsToMany<Project, $this> */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class)->withPivot('sort_order');
    }

    /** @return HasMany<Skill, $this> */
    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    /**
     * Tecnologias visíveis publicamente: associadas a um projecto publicado ou a uma competência publicada.
     */
    #[Scope]
    protected function publiclyVisible(Builder $query): void
    {
        $query->where(function (Builder $query): void {
            $query->whereHas('projects', fn (Builder $q) => $q->published())
                ->orWhereHas('skills', fn (Builder $q) => $q->published()->whereHas('category', fn (Builder $c) => $c->published()));
        });
    }
}
