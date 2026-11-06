<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\CertificationRequest;
use App\Models\Certification;

/** @extends CrudController<Certification> */
class CertificationController extends CrudController
{
    protected string $model = Certification::class;

    protected string $request = CertificationRequest::class;

    protected string $logName = 'certification';

    protected array $searchable = ['name', 'issuer'];

    protected array $filters = ['is_published' => 'is_published', 'kind' => 'kind'];

    protected array $with = ['document'];
}
