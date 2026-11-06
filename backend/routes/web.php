<?php

use Illuminate\Support\Facades\Route;

// O site público é a aplicação React; a raiz do backend encaminha para ela.
Route::get('/', fn () => redirect()->away(config('portfolio.frontend_url')));
