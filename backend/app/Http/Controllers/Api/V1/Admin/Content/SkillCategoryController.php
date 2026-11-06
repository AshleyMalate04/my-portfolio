<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\SkillCategoryRequest;
use App\Models\SkillCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

/** @extends CrudController<SkillCategory> */
class SkillCategoryController extends CrudController
{
    protected string $model = SkillCategory::class;

    protected string $request = SkillCategoryRequest::class;

    protected string $logName = 'skill_category';

    protected array $searchable = ['slug', 'name'];

    protected array $filters = ['is_published' => 'is_published'];

    /** Evita apagar em cascata competências por engano. */
    protected function beforeDelete(Model $record): void
    {
        if ($record->skills()->exists()) {
            throw ValidationException::withMessages(['skills' => __('admin.category_has_skills')]);
        }
    }

    protected function newQuery(): Builder
    {
        return SkillCategory::query()->withCount('skills');
    }
}
