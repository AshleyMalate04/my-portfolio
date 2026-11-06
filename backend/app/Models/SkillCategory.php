<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'description', 'sort_order', 'is_published'])]
class SkillCategory extends Model
{
    use HasTranslations, Publishable;

    protected array $translatable = ['name', 'description'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    /** @return HasMany<Skill, $this> */
    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }
}
