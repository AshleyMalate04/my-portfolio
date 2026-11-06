<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Support\IpHasher;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Regista acções administrativas relevantes. As propriedades nunca devem conter segredos.
 */
class ActivityLogger
{
    public function __construct(private readonly Request $request) {}

    /** @param array<string, mixed> $properties */
    public function log(string $action, ?Model $subject = null, array $properties = []): ActivityLog
    {
        return ActivityLog::query()->create([
            'user_id' => $this->request->user()?->getAuthIdentifier(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'properties' => $properties === [] ? null : $properties,
            'ip_hash' => IpHasher::hash($this->request->ip()),
        ]);
    }
}
