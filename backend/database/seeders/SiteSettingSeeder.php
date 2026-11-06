<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'site_name' => 'Ashley da Amena Mario Malate',
            'brand_wordmark' => 'ashley',
            'site_tagline' => [
                'pt' => 'Portfólio de desenvolvimento de software',
                'en' => 'Software development portfolio',
            ],
            'seo_title' => [
                'pt' => 'Ashley da Amena Mario Malate — Desenvolvedora de software',
                'en' => 'Ashley da Amena Mario Malate — Software developer',
            ],
            'seo_description' => [
                'pt' => 'Portfólio de Ashley da Amena Mario Malate, estudante de Informática e desenvolvedora de aplicações web e móveis em Maputo, Moçambique.',
                'en' => 'Portfolio of Ashley da Amena Mario Malate, Computer Science student and web and mobile application developer based in Maputo, Mozambique.',
            ],
            'primary_cta_label' => ['pt' => 'Vamos conversar', 'en' => "Let's talk"],
            // Frase da secção de contacto (editável em Definições).
            'contact_headline' => [
                'pt' => 'Cada bom sistema começa com uma boa conversa.',
                'en' => 'Every good system starts with a good conversation.',
            ],
            'logo_media_id' => null,
            'favicon_media_id' => null,
            'og_image_media_id' => null,
            // Testemunhos ocultos até existirem testemunhos reais e autorizados.
            'sections' => [
                'about' => true,
                'skills' => true,
                'projects' => true,
                'services' => true,
                'process' => true,
                'journey' => true,
                'testimonials' => false,
                'contact' => true,
            ],
        ];

        foreach ($settings as $key => $value) {
            SiteSetting::query()->firstOrCreate(['key' => $key], ['value' => $value, 'is_public' => true]);
        }
    }
}
