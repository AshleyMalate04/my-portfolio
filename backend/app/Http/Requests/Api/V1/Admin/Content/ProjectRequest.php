<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Enums\MediaKind;
use App\Enums\ProjectStatus;
use App\Enums\PublicationStatus;
use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Rules\MediaOfKind;
use App\Support\Translatable;
use Illuminate\Validation\Rule;

class ProjectRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $long = 10000;
        $section = 5000;

        return [
            'slug' => $this->slugRules('projects'),
            ...Translatable::text('title', $this->presence() === 'required' ? 'required' : 'sometimes', 160),
            ...Translatable::text('summary', 'nullable', 500),
            ...Translatable::text('description', 'nullable', $long),
            ...Translatable::text('problem', 'nullable', $section),
            ...Translatable::text('objective', 'nullable', $section),
            ...Translatable::text('solution', 'nullable', $section),
            ...Translatable::text('contribution', 'nullable', $section),
            ...Translatable::text('challenges', 'nullable', $section),
            ...Translatable::text('results', 'nullable', $section),
            ...Translatable::list('features', 40, 200),
            ...Translatable::text('seo_title', 'nullable', 70),
            ...Translatable::text('seo_description', 'nullable', 170),
            'project_category_id' => ['nullable', 'integer', 'exists:project_categories,id'],
            'project_status' => ['nullable', Rule::enum(ProjectStatus::class)],
            'publication_status' => ['sometimes', Rule::enum(PublicationStatus::class)],
            'is_featured' => ['sometimes', 'boolean'],
            'started_at' => $this->dateRules(),
            'ended_at' => [...$this->dateRules(), 'after_or_equal:started_at'],
            'demo_url' => $this->urlRules(),
            'repository_url' => $this->urlRules(),
            'cover_media_id' => ['nullable', new MediaOfKind(MediaKind::Image)],
            'internal_notes' => ['nullable', 'string', 'max:5000'],
            'technology_ids' => ['sometimes', 'array', 'max:30'],
            'technology_ids.*' => ['integer', 'distinct', 'exists:technologies,id'],
        ];
    }
}
