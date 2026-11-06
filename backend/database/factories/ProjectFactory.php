<?php

namespace Database\Factories;

use App\Enums\PublicationStatus;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $title = fake()->unique()->words(3, true);

        return [
            'slug' => Str::slug($title),
            'title' => ['pt' => Str::title($title)],
            'summary' => ['pt' => fake()->sentence()],
            'publication_status' => PublicationStatus::Draft,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'publication_status' => PublicationStatus::Published,
            'published_at' => now(),
        ]);
    }
}
