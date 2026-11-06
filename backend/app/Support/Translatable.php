<?php

namespace App\Support;

/**
 * Regras de validação para campos traduzíveis {"pt": ..., "en": ...}.
 * O português é obrigatório quando o campo é obrigatório; o inglês é sempre opcional.
 */
final class Translatable
{
    /**
     * Texto traduzível.
     *
     * @param  'required'|'sometimes'|'nullable'  $presence
     * @return array<string, list<string>>
     */
    public static function text(string $field, string $presence = 'nullable', int $max = 255): array
    {
        $locales = implode(',', config('portfolio.locales'));

        // Campo obrigatório: ao criar exige-se sempre; ao editar ("sometimes"), só quando é enviado.
        $ptPresence = match ($presence) {
            'required' => 'required',
            'sometimes' => "required_with:{$field}",
            default => 'nullable',
        };

        return [
            $field => [$presence === 'nullable' ? 'nullable' : $presence, 'array:'.$locales],
            "{$field}.pt" => [$ptPresence, 'nullable', 'string', "max:{$max}"],
            "{$field}.en" => ['nullable', 'string', "max:{$max}"],
        ];
    }

    /**
     * Lista de textos traduzível (ex.: funcionalidades, interesses): {"pt": ["..."], "en": ["..."]}.
     *
     * @return array<string, list<string>>
     */
    public static function list(string $field, int $maxItems = 30, int $maxLength = 200): array
    {
        $locales = implode(',', config('portfolio.locales'));

        return [
            $field => ['nullable', 'array:'.$locales],
            "{$field}.pt" => ['nullable', 'array', "max:{$maxItems}"],
            "{$field}.pt.*" => ['nullable', 'string', "max:{$maxLength}"],
            "{$field}.en" => ['nullable', 'array', "max:{$maxItems}"],
            "{$field}.en.*" => ['nullable', 'string', "max:{$maxLength}"],
        ];
    }

    /**
     * Remove traduções vazias e devolve null quando nada foi preenchido,
     * para que a API pública recorra correctamente ao português.
     */
    public static function clean(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $cleaned = [];

        foreach ($value as $locale => $content) {
            if (is_array($content)) {
                $content = array_values(array_filter(array_map(fn ($item) => is_string($item) ? trim($item) : $item, $content), fn ($item) => $item !== '' && $item !== null));
            } elseif (is_string($content)) {
                $content = trim($content);
            }

            if ($content !== '' && $content !== null && $content !== []) {
                $cleaned[$locale] = $content;
            }
        }

        return $cleaned === [] ? null : $cleaned;
    }
}
