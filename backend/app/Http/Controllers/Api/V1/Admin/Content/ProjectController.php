<?php

namespace App\Http\Controllers\Api\V1\Admin\Content;

use App\Enums\MediaKind;
use App\Enums\PublicationStatus;
use App\Http\Controllers\Api\V1\Admin\CrudController;
use App\Http\Requests\Api\V1\Admin\Content\ProjectRequest;
use App\Http\Resources\Api\V1\Admin\AdminProjectResource;
use App\Http\Resources\Api\V1\ProjectResource;
use App\Models\Project;
use App\Models\ProjectImage;
use App\Rules\MediaOfKind;
use App\Support\Translatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Projectos: CRUD, publicação, destaque, ordem, tecnologias, galeria e pré-visualização.
 *
 * @extends CrudController<Project>
 */
class ProjectController extends CrudController
{
    protected string $model = Project::class;

    protected string $request = ProjectRequest::class;

    protected string $resource = AdminProjectResource::class;

    protected string $logName = 'project';

    protected array $searchable = ['title', 'slug', 'summary'];

    protected array $filters = [
        'publication_status' => 'publication_status',
        'project_category_id' => 'project_category_id',
        'is_featured' => 'is_featured',
    ];

    protected array $with = ['category', 'cover', 'technologies', 'images.media'];

    /** Mesma ordem do site público (destaques primeiro). */
    protected function applyOrdering(Builder $query): void
    {
        $query->orderByDesc('is_featured')->orderBy('sort_order')->orderBy('id');
    }

    protected function prepare(array $data, ?Model $record): array
    {
        $data = parent::prepare($data, $record);
        unset($data['technology_ids']);

        // A data de publicação é definida na primeira publicação e mantida depois disso.
        if (($data['publication_status'] ?? null) === PublicationStatus::Published->value && ! $record?->published_at) {
            $data['published_at'] = now();
        }

        return $data;
    }

    protected function afterSave(Model $record, array $validated): void
    {
        if (array_key_exists('technology_ids', $validated)) {
            $record->technologies()->sync(
                collect($validated['technology_ids'])->values()->mapWithKeys(fn (int $id, int $i) => [$id => ['sort_order' => $i]])->all(),
            );
        }
    }

    /** Pré-visualização no formato público, para qualquer estado (incluindo rascunhos). */
    public function preview(Request $request, int $id): ProjectResource
    {
        $project = $this->find($id)->load(['category', 'cover', 'technologies', 'images.media']);

        return ProjectResource::make($project);
    }

    public function addImage(Request $request, int $id): JsonResponse
    {
        $project = $this->find($id);
        $data = $request->validate([
            'media_id' => ['required', new MediaOfKind(MediaKind::Image), Rule::unique('project_images')->where('project_id', $project->id)],
            ...Translatable::text('caption', 'nullable', 255),
        ]);

        ProjectImage::query()->create([
            'project_id' => $project->id,
            'media_id' => $data['media_id'],
            'caption' => Translatable::clean($data['caption'] ?? null),
            'sort_order' => (int) $project->images()->max('sort_order') + 1,
        ]);
        $this->activity->log('project.image_added', $project, ['media_id' => (int) $data['media_id']]);

        return $this->respond($project, 201);
    }

    public function updateImage(Request $request, int $id, int $imageId): JsonResponse
    {
        $project = $this->find($id);
        $image = $project->images()->findOrFail($imageId);
        $data = $request->validate(Translatable::text('caption', 'nullable', 255));

        $image->update(['caption' => Translatable::clean($data['caption'] ?? null)]);

        return $this->respond($project);
    }

    /** Remove a imagem da galeria; o ficheiro continua na biblioteca (pode estar a ser usado noutro sítio). */
    public function removeImage(int $id, int $imageId): JsonResponse
    {
        $project = $this->find($id);
        $project->images()->findOrFail($imageId)->delete();
        $this->activity->log('project.image_removed', $project, ['image_id' => $imageId]);

        return $this->respond($project);
    }

    public function reorderImages(Request $request, int $id): JsonResponse
    {
        $project = $this->find($id);
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer', 'distinct']])['ids'];

        if ($project->images()->whereIn('id', $ids)->count() !== count($ids)) {
            throw ValidationException::withMessages(['ids' => __('admin.reorder_invalid')]);
        }

        DB::transaction(function () use ($project, $ids) {
            foreach ($ids as $position => $imageId) {
                $project->images()->whereKey($imageId)->update(['sort_order' => $position]);
            }
        });

        return $this->respond($project);
    }

    private function respond(Project $project, int $status = 200): JsonResponse
    {
        return AdminProjectResource::make($project->fresh($this->with))
            ->additional(['message' => __('admin.updated')])
            ->response()
            ->setStatusCode($status);
    }
}
