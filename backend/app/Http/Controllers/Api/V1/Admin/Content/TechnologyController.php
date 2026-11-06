<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\TechnologyRequest;
use App\Models\Technology;

/** @extends CrudController<Technology> */
class TechnologyController extends CrudController
{
    protected string $model = Technology::class;

    protected string $request = TechnologyRequest::class;

    protected string $logName = 'technology';

    protected array $searchable = ['name', 'slug'];

    protected bool $sortable = false;
}
