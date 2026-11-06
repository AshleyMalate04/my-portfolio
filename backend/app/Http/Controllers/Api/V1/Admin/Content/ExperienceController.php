<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\ExperienceRequest;
use App\Models\Experience;

/** @extends CrudController<Experience> */
class ExperienceController extends CrudController
{
    protected string $model = Experience::class;

    protected string $request = ExperienceRequest::class;

    protected string $logName = 'experience';

    protected array $searchable = ['organization', 'role'];

    protected array $filters = ['is_published' => 'is_published', 'employment_type' => 'employment_type'];
}
