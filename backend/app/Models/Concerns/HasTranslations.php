<?php

namespace App\Models\Concerns;

/**
 * Campos traduzíveis guardados em JSONB no formato {"pt": "...", "en": "..."}.
 *
 * O modelo declara a lista em $translatable. A leitura localizada usa o idioma
 * pedido e recorre ao idioma principal quando a tradução está vazia.
 */
trait HasTranslations
{
    public function initializeHasTranslations(): void
    {
        foreach ($this->translatable as $attribute) {
            $this->mergeCasts([$attribute => 'array']);
        }
    }

    /** @return list<string> */
    public function getTranslatableAttributes(): array
    {
        return $this->translatable;
    }

    public function translate(string $attribute, ?string $locale = null): mixed
    {
        $values = $this->getAttribute($attribute);

        if (! is_array($values)) {
            return null;
        }

        $locale ??= app()->getLocale();
        $fallback = config('portfolio.default_locale');

        if (self::hasContent($values[$locale] ?? null)) {
            return $values[$locale];
        }

        return self::hasContent($values[$fallback] ?? null) ? $values[$fallback] : null;
    }

    private static function hasContent(mixed $value): bool
    {
        return is_array($value) ? $value !== [] : is_string($value) && trim($value) !== '';
    }
}
