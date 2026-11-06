<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'institution', 'institution_short_name', 'degree', 'field', 'specialization', 'description',
    'location', 'started_at', 'ended_at', 'is_current', 'sort_order', 'is_published',
])]
class Education extends Model
{
    use HasTranslations, Publishable;

    // "education" é incontável para o pluraliser do Laravel; a tabela usa o plural explícito.
    protected $table = 'educations';

    protected array $translatable = ['degree', 'field', 'specialization', 'description'];

    protected function casts(): array
    {
        return [
            'started_at' => 'date:Y-m-d',
            'ended_at' => 'date:Y-m-d',
            'is_current' => 'boolean',
            'is_published' => 'boolean',
        ];
    }
}
