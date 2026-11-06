<?php

namespace App\Enums;

enum MediaKind: string
{
    case Image = 'image';
    case Document = 'document';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
