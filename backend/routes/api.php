<?php

use App\Http\Controllers\Api\V1\Admin\AuthController;
use App\Http\Controllers\Api\V1\Admin\Content as Admin;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Admin\PasswordController;
use App\Http\Controllers\Api\V1\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Api\V1\Admin\SettingsController;
use App\Http\Controllers\Api\V1\CatalogueController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\SiteController;
use App\Http\Middleware\PublicCacheHeaders;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->middleware('throttle:api')->group(function () {
    // --- API pública: apenas conteúdo publicado (cache HTTP curta) ------------------------
    Route::middleware(PublicCacheHeaders::class)->group(function () {
        Route::get('home', [HomeController::class, 'show'])->name('home');
        Route::get('site', [SiteController::class, 'show'])->name('site');
        Route::get('profile', [ProfileController::class, 'show'])->name('profile');
        Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('projects/{slug}', [ProjectController::class, 'show'])->name('projects.show');
        Route::get('project-categories', [CatalogueController::class, 'projectCategories'])->name('project-categories');
        Route::get('skills', [CatalogueController::class, 'skills'])->name('skills');
        Route::get('technologies', [CatalogueController::class, 'technologies'])->name('technologies');
        Route::get('journey', [CatalogueController::class, 'journey'])->name('journey');
        Route::get('services', [CatalogueController::class, 'services'])->name('services');
        Route::get('process-steps', [CatalogueController::class, 'processSteps'])->name('process-steps');
        Route::get('testimonials', [CatalogueController::class, 'testimonials'])->name('testimonials');
        Route::get('social-links', [CatalogueController::class, 'socialLinks'])->name('social-links');
    });

    // --- Backoffice ---------------------------------------------------------------------
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::post('auth/login', [AuthController::class, 'login'])
            ->middleware('throttle:admin-login')
            ->name('auth.login');
        Route::get('auth/options', [PasswordController::class, 'options'])->name('auth.options');
        Route::post('auth/forgot-password', [PasswordController::class, 'forgot'])
            ->middleware('throttle:password-reset')
            ->name('auth.forgot-password');
        Route::post('auth/reset-password', [PasswordController::class, 'reset'])
            ->middleware('throttle:password-reset')
            ->name('auth.reset-password');

        Route::middleware(['auth:sanctum', 'can:access-admin'])->group(function () {
            Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
            Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
            Route::put('auth/password', [PasswordController::class, 'change'])->name('auth.password');

            Route::get('dashboard/summary', [DashboardController::class, 'summary'])->name('dashboard.summary');

            Route::get('profile', [AdminProfileController::class, 'show'])->name('profile.show');
            Route::put('profile', [AdminProfileController::class, 'update'])->name('profile.update');
            Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');
            Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

            // Recursos com CRUD completo e ordenação manual (PATCH permite alterações parciais, ex.: publicar).
            $resources = [
                'projects' => Admin\ProjectController::class,
                'project-categories' => Admin\ProjectCategoryController::class,
                'technologies' => Admin\TechnologyController::class,
                'skill-categories' => Admin\SkillCategoryController::class,
                'skills' => Admin\SkillController::class,
                'educations' => Admin\EducationController::class,
                'experiences' => Admin\ExperienceController::class,
                'certifications' => Admin\CertificationController::class,
                'services' => Admin\ServiceController::class,
                'process-steps' => Admin\ProcessStepController::class,
                'social-links' => Admin\SocialLinkController::class,
                'testimonials' => Admin\TestimonialController::class,
            ];

            foreach ($resources as $uri => $controller) {
                Route::post("{$uri}/reorder", [$controller, 'reorder'])->name("{$uri}.reorder");
                Route::get($uri, [$controller, 'index'])->name("{$uri}.index");
                Route::post($uri, [$controller, 'store'])->name("{$uri}.store");
                Route::get("{$uri}/{id}", [$controller, 'show'])->whereNumber('id')->name("{$uri}.show");
                Route::match(['put', 'patch'], "{$uri}/{id}", [$controller, 'update'])->whereNumber('id')->name("{$uri}.update");
                Route::delete("{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id')->name("{$uri}.destroy");
            }

            Route::prefix('projects/{id}')->whereNumber('id')->name('projects.')->group(function () {
                Route::get('preview', [Admin\ProjectController::class, 'preview'])->name('preview');
                Route::post('images', [Admin\ProjectController::class, 'addImage'])->name('images.store');
                Route::post('images/reorder', [Admin\ProjectController::class, 'reorderImages'])->name('images.reorder');
                Route::patch('images/{imageId}', [Admin\ProjectController::class, 'updateImage'])->whereNumber('imageId')->name('images.update');
                Route::delete('images/{imageId}', [Admin\ProjectController::class, 'removeImage'])->whereNumber('imageId')->name('images.destroy');
            });

            Route::get('media', [MediaController::class, 'index'])->name('media.index');
            Route::post('media', [MediaController::class, 'store'])->name('media.store');
            Route::get('media/{id}', [MediaController::class, 'show'])->whereNumber('id')->name('media.show');
            Route::patch('media/{id}', [MediaController::class, 'update'])->whereNumber('id')->name('media.update');
            Route::post('media/{id}/replace', [MediaController::class, 'replace'])->whereNumber('id')->name('media.replace');
            Route::delete('media/{id}', [MediaController::class, 'destroy'])->whereNumber('id')->name('media.destroy');
        });
    });
});
