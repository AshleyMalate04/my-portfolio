<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\ServiceRequest;
use App\Models\Service;

/** @extends CrudController<Service> */
class ServiceController extends CrudController
{
    protected string $model = Service::class;

    protected string $request = ServiceRequest::class;

    protected string $logName = 'service';

    protected array $searchable = ['slug', 'title', 'summary'];

    protected array $filters = ['is_published' => 'is_published'];
}
