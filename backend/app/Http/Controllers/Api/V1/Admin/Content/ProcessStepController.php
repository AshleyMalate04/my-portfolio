<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\ProcessStepRequest;
use App\Models\ProcessStep;

/** @extends CrudController<ProcessStep> */
class ProcessStepController extends CrudController
{
    protected string $model = ProcessStep::class;

    protected string $request = ProcessStepRequest::class;

    protected string $logName = 'process_step';

    protected array $searchable = ['title'];

    protected array $filters = ['is_published' => 'is_published'];
}
