<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\SkillRequest;
use App\Models\Skill;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/** @extends CrudController<Skill> */
class SkillController extends CrudController
{
    protected string $model = Skill::class;

    protected string $request = SkillRequest::class;

    protected string $logName = 'skill';

    protected array $searchable = ['name'];

    protected array $filters = ['skill_category_id' => 'skill_category_id', 'is_published' => 'is_published'];

    protected array $with = ['category', 'technology'];

    /** As competências são ordenadas dentro da respectiva categoria. */
    protected function reorderScope(Request $request): Builder
    {
        $categoryId = $request->validate(['skill_category_id' => ['required', 'integer', 'exists:skill_categories,id']])['skill_category_id'];

        return Skill::query()->where('skill_category_id', $categoryId);
    }

    protected function applyOrdering(Builder $query): void
    {
        $query->orderBy('skill_category_id')->orderBy('sort_order')->orderBy('id');
    }
}
