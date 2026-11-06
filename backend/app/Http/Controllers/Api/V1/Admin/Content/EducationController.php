<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\EducationRequest;
use App\Models\Education;

/** @extends CrudController<Education> */
class EducationController extends CrudController
{
    protected string $model = Education::class;

    protected string $request = EducationRequest::class;

    protected string $logName = 'education';

    protected array $searchable = ['institution', 'degree', 'specialization'];

    protected array $filters = ['is_published' => 'is_published'];
}
