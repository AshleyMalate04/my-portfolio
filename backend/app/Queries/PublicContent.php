<?php

namespace App\Queries;

use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Media;
use App\Models\ProcessStep;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\Service;
use App\Models\SiteSetting;
use App\Models\SkillCategory;
use App\Models\SocialLink;
use App\Models\Technology;
use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

/**
 * Consultas do conteúdo público, partilhadas pelas listagens individuais e pelo endpoint agregado /home.
 * Devolvem sempre apenas conteúdo publicado, pela ordem definida no backoffice.
 */
class PublicContent
{
    /** @return Builder<Project> */
    public function projects(): Builder
    {
        return Project::query()->published()->with(['category', 'cover', 'technologies'])->ordered();
    }

    /** @return Collection<int, ProjectCategory> */
    public function projectCategories(): Collection
    {
        return ProjectCategory::query()
            ->whereHas('projects', fn (Builder $q) => $q->published())
            ->withCount(['projects' => fn (Builder $q) => $q->published()])
            ->ordered()
            ->get();
    }

    /** @return Collection<int, SkillCategory> */
    public function skills(): Collection
    {
        return SkillCategory::query()
            ->published()
            ->whereHas('skills', fn (Builder $q) => $q->published())
            ->with(['skills' => fn ($q) => $q->published()->ordered()->with('technology')])
            ->ordered()
            ->get();
    }

    /** @return Collection<int, Technology> */
    public function technologies(): Collection
    {
        return Technology::query()->publiclyVisible()->orderBy('name')->get();
    }

    /** @return array{education: Collection<int, Education>, experience: Collection<int, Experience>, certifications: Collection<int, Certification>} */
    public function journey(): array
    {
        return [
            'education' => Education::query()->published()->ordered()->get(),
            'experience' => Experience::query()->published()->ordered()->get(),
            'certifications' => Certification::query()->published()->ordered()->with('document')->get(),
        ];
    }

    /** @return Collection<int, Service> */
    public function services(): Collection
    {
        return Service::query()->published()->ordered()->get();
    }

    /** @return Collection<int, ProcessStep> */
    public function processSteps(): Collection
    {
        return ProcessStep::query()->published()->ordered()->get();
    }

    /** @return Collection<int, Testimonial> */
    public function testimonials(): Collection
    {
        return Testimonial::query()->visible()->ordered()->with('authorPhoto')->get();
    }

    /** @return Collection<int, SocialLink> */
    public function socialLinks(): Collection
    {
        return SocialLink::query()->published()->ordered()->get();
    }

    /**
     * Definições públicas no idioma actual. Valores traduzíveis {"pt": ..., "en": ...} são resolvidos e
     * as chaves "*_media_id" são substituídas pelo ficheiro correspondente (ex.: og_image_media_id → og_image).
     *
     * @return array<string, mixed>
     */
    public function settings(): array
    {
        $locale = app()->getLocale();
        $fallback = config('portfolio.default_locale');
        $values = SiteSetting::publicValues();

        $mediaIds = collect($values)->filter(fn ($value, string $key) => Str::endsWith($key, '_media_id') && is_int($value));
        $media = Media::query()->whereIn('id', $mediaIds->values())->get()->keyBy('id');

        $resolved = [];

        foreach ($values as $key => $value) {
            if (Str::endsWith($key, '_media_id')) {
                $file = is_int($value) ? $media->get($value) : null;
                $resolved[Str::beforeLast($key, '_media_id')] = $file === null ? null : [
                    'url' => $file->url,
                    'width' => $file->width,
                    'height' => $file->height,
                    'mime_type' => $file->mime_type,
                ];

                continue;
            }

            $resolved[$key] = is_array($value) && array_key_exists($fallback, $value)
                ? (filled($value[$locale] ?? null) ? $value[$locale] : $value[$fallback])
                : $value;
        }

        return $resolved;
    }
}
