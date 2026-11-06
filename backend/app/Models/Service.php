<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'title', 'summary', 'description', 'icon', 'sort_order', 'is_published'])]
class Service extends Model
{
    use HasTranslations, Publishable;

    protected array $translatable = ['title', 'summary', 'description'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }
}
