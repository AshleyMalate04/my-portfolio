<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * O site deixou de ter formulário de contacto: remove a tabela de mensagens e as definições
 * que só serviam o formulário e o rodapé. Instalações novas nem chegam a criar a tabela
 * (dropIfExists torna esta migration segura nos dois casos).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('contact_messages');

        DB::table('site_settings')
            ->whereIn('key', ['contact_form', 'contact_privacy_note', 'footer_note'])
            ->delete();
    }

    public function down(): void
    {
        // Sem retorno: as mensagens apagadas não podem ser recuperadas.
    }
};
