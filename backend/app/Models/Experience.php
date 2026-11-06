<?php

namespace App\Models;

use App\Enums\EmploymentType;
use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'organization', 'role', 'employment_type', 'description', 'location',
    'started_at', 'ended_at', 'is_current', 'sort_order', 'is_published',
])]
class Experience extends Model
{
    use HasTranslations, Publishable;

    protected array $translatable = ['role', 'description'];

    protected function casts(): array
    {
        return [
            'employment_type' => EmploymentType::class,
            'started_at' => 'date:Y-m-d',
            'ended_at' => 'date:Y-m-d',
            'is_current' => 'boolean',
            'is_published' => 'boolean',
        ];
    }
}
