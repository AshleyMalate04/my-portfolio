<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProjectResource;
use App\Http\Resources\Api\V1\ProjectSummaryResource;
use App\Models\Project;
use App\Queries\PublicContent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function index(Request $request, PublicContent $content): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'category' => ['sometimes', 'string', 'max:100'],
            'technology' => ['sometimes', 'string', 'max:100'],
            'featured' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $projects = $content->projects()
            ->when($filters['category'] ?? null, fn (Builder $q, string $slug) => $q->whereHas('category', fn (Builder $c) => $c->where('slug', $slug)))
            ->when($filters['technology'] ?? null, fn (Builder $q, string $slug) => $q->whereHas('technologies', fn (Builder $t) => $t->where('slug', $slug)))
            ->when($request->boolean('featured'), fn (Builder $q) => $q->where('is_featured', true))
            ->paginate($filters['per_page'] ?? 12)
            ->withQueryString();

        return ProjectSummaryResource::collection($projects);
    }

    public function show(string $slug): ProjectResource
    {
        $project = Project::query()
            ->published()
            ->where('slug', $slug)
            ->with(['category', 'cover', 'technologies', 'images.media'])
            ->firstOrFail();

        return ProjectResource::make($project);
    }
}
