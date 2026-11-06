<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Etapa da metodologia de trabalho apresentada no site.
 */
#[Fillable(['title', 'description', 'sort_order', 'is_published'])]
class ProcessStep extends Model
{
    use HasTranslations, Publishable;

    protected array $translatable = ['title', 'description'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }
}
