<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\TestimonialRequest;
use App\Models\Testimonial;

/** @extends CrudController<Testimonial> */
class TestimonialController extends CrudController
{
    protected string $model = Testimonial::class;

    protected string $request = TestimonialRequest::class;

    protected string $logName = 'testimonial';

    protected array $searchable = ['author_name', 'author_organization', 'quote'];

    protected array $filters = ['is_published' => 'is_published'];

    protected array $with = ['authorPhoto'];
}
