<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Definições gerais do site em formato chave/valor (valor JSON).
 * Valores traduzíveis usam a mesma estrutura {"pt": ..., "en": ...} dos modelos.
 */
#[Fillable(['key', 'value', 'is_public'])]
class SiteSetting extends Model
{
    protected function casts(): array
    {
        return [
            'value' => 'array',
            'is_public' => 'boolean',
        ];
    }

    #[Scope]
    protected function public(Builder $query): void
    {
        $query->where('is_public', true);
    }

    /** @return array<string, mixed> */
    public static function publicValues(): array
    {
        return static::query()->public()->orderBy('key')->pluck('value', 'key')->all();
    }
}
