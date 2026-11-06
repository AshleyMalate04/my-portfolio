<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\ProjectCategoryRequest;
use App\Models\ProjectCategory;

/** @extends CrudController<ProjectCategory> */
class ProjectCategoryController extends CrudController
{
    protected string $model = ProjectCategory::class;

    protected string $request = ProjectCategoryRequest::class;

    protected string $logName = 'project_category';

    protected array $searchable = ['slug', 'name'];
}
