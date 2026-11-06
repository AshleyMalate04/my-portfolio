<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\SocialLinkRequest;
use App\Models\SocialLink;

/** @extends CrudController<SocialLink> */
class SocialLinkController extends CrudController
{
    protected string $model = SocialLink::class;

    protected string $request = SocialLinkRequest::class;

    protected string $logName = 'social_link';

    protected array $searchable = ['label', 'url', 'platform'];

    protected array $filters = ['is_published' => 'is_published'];
}
