<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registo único com o perfil profissional apresentado no site.
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('display_name')->nullable();
            $table->jsonb('headline')->nullable();
            $table->jsonb('short_bio')->nullable();
            $table->jsonb('long_bio')->nullable();
            $table->jsonb('hero_phrases')->nullable();
            $table->jsonb('interests')->nullable();
            $table->jsonb('approach')->nullable();
            $table->jsonb('goals')->nullable();
            $table->string('location')->nullable();
            $table->string('public_email')->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('whatsapp', 40)->nullable();
            $table->string('availability_status', 30)->nullable();
            $table->jsonb('availability_note')->nullable();
            $table->boolean('show_availability')->default(false);
            $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('hero_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('cv_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->jsonb('value')->nullable();
            // Só as definições marcadas como públicas são devolvidas pela API pública.
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('profiles');
    }
};
