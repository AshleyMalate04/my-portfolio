<?php

namespace App\Support;

/**
 * Converte um IP num identificador não reversível (HMAC com a chave da aplicação),
 * suficiente para detectar abusos sem guardar o endereço em claro.
 */
final class IpHasher
{
    public static function hash(?string $ip): ?string
    {
        if ($ip === null || $ip === '') {
            return null;
        }

        return hash_hmac('sha256', $ip, (string) config('app.key'));
    }
}
