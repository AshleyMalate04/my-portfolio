<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->jsonb('title');
            $table->jsonb('summary')->nullable();
            $table->jsonb('description')->nullable();
            // Nome de um ícone Lucide (ex.: "code-xml"); o frontend só aceita nomes conhecidos.
            $table->string('icon', 50)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->index(['is_published', 'sort_order']);
        });

        Schema::create('process_steps', function (Blueprint $table) {
            $table->id();
            $table->jsonb('title');
            $table->jsonb('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->index(['is_published', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('process_steps');
        Schema::dropIfExists('services');
    }
};
