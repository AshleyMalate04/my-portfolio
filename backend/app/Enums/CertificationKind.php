<?php

namespace App\Enums;

enum CertificationKind: string
{
    case Course = 'course';
    case Certification = 'certification';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
