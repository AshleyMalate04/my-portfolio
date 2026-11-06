<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\MediaKind;
use App\Rules\MediaOfKind;
use App\Support\Translatable;

/**
 * Definições gerais. Só as chaves listadas aqui podem ser gravadas (lista fechada): o backoffice
 * não consegue criar definições arbitrárias nem guardar HTML/JS que o site execute.
 */
class SettingsRequest extends AdminFormRequest
{
    public const SECTIONS = ['about', 'skills', 'projects', 'services', 'process', 'journey', 'testimonials', 'contact'];

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'site_name' => ['sometimes', 'required', 'string', 'max:120'],
            'brand_wordmark' => ['sometimes', 'nullable', 'string', 'max:30'],
            ...Translatable::text('site_tagline', 'nullable', 160),
            ...Translatable::text('seo_title', 'nullable', 70),
            ...Translatable::text('seo_description', 'nullable', 170),
            ...Translatable::text('primary_cta_label', 'nullable', 40),
            ...Translatable::text('contact_headline', 'nullable', 160),
            'logo_media_id' => ['sometimes', 'nullable', new MediaOfKind(MediaKind::Image)],
            'favicon_media_id' => ['sometimes', 'nullable', new MediaOfKind(MediaKind::Image)],
            'og_image_media_id' => ['sometimes', 'nullable', new MediaOfKind(MediaKind::Image)],
            'sections' => ['sometimes', 'array:'.implode(',', self::SECTIONS)],
            'sections.*' => ['boolean'],
        ];
    }

    /** Chaves aceites (para filtrar o pedido). */
    public static function settingKeys(): array
    {
        return [
            'site_name', 'brand_wordmark', 'site_tagline', 'seo_title', 'seo_description', 'primary_cta_label',
            'contact_headline', 'logo_media_id', 'favicon_media_id', 'og_image_media_id', 'sections',
        ];
    }
}
