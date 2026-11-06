<?php

namespace App\Enums;

enum SocialPlatform: string
{
    case LinkedIn = 'linkedin';
    case GitHub = 'github';
    case Email = 'email';
    case WhatsApp = 'whatsapp';
    case Instagram = 'instagram';
    case X = 'x';
    case Behance = 'behance';
    case Dribbble = 'dribbble';
    case Website = 'website';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
