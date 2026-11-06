<?php

namespace App\Models;

use App\Enums\SocialPlatform;
use App\Models\Concerns\Publishable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['platform', 'label', 'url', 'sort_order', 'is_published'])]
class SocialLink extends Model
{
    use Publishable;

    protected function casts(): array
    {
        return [
            'platform' => SocialPlatform::class,
            'is_published' => 'boolean',
        ];
    }
}
