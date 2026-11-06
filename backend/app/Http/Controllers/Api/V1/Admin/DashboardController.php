<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Media;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Service;
use App\Models\Skill;
use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;

/**
 * Totais reais para o painel. Nada é estimado ou inventado (não há métricas de tráfego sem integração).
 */
class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $projects = Project::query()
            ->selectRaw('publication_status, count(*) as total')
            ->groupBy('publication_status')
            ->pluck('total', 'publication_status');

        return response()->json([
            'data' => [
                'projects' => [
                    'published' => (int) ($projects[PublicationStatus::Published->value] ?? 0),
                    'draft' => (int) ($projects[PublicationStatus::Draft->value] ?? 0),
                ],
                'skills' => [
                    'total' => Skill::query()->count(),
                    'published' => Skill::query()->published()->count(),
                ],
                'services' => ['published' => Service::query()->published()->count(), 'total' => Service::query()->count()],
                'testimonials' => ['pending' => Testimonial::query()->where('is_published', false)->count()],
                'media' => ['total' => Media::query()->count()],
                'recent_changes' => $this->recentChanges(),
            ],
        ]);
    }

    /**
     * Conteúdos alterados mais recentemente, de vários tipos.
     *
     * @return list<array{type: string, id: int, label: string, updated_at: string|null}>
     */
    private function recentChanges(): array
    {
        $sources = [
            'project' => [Project::class, fn (Project $m) => $m->translate('title', 'pt')],
            'service' => [Service::class, fn (Service $m) => $m->translate('title', 'pt')],
            'skill' => [Skill::class, fn (Skill $m) => $m->translate('name', 'pt')],
            'education' => [Education::class, fn (Education $m) => $m->translate('degree', 'pt')],
            'experience' => [Experience::class, fn (Experience $m) => $m->translate('role', 'pt')],
            'certification' => [Certification::class, fn (Certification $m) => $m->translate('name', 'pt')],
            'testimonial' => [Testimonial::class, fn (Testimonial $m) => $m->author_name],
            'profile' => [Profile::class, fn (Profile $m) => $m->full_name],
        ];

        return collect($sources)
            ->flatMap(fn (array $source, string $type) => $source[0]::query()->latest('updated_at')->limit(6)->get()
                ->map(fn (Model $model) => [
                    'type' => $type,
                    'id' => $model->getKey(),
                    'label' => (string) $source[1]($model),
                    'updated_at' => $model->updated_at?->toIso8601String(),
                ]))
            ->sortByDesc('updated_at')
            ->take(8)
            ->values()
            ->all();
    }
}
