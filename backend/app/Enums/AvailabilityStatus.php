<?php

namespace App\Enums;

enum AvailabilityStatus: string
{
    case Available = 'available';
    case OpenToOpportunities = 'open_to_opportunities';
    case Unavailable = 'unavailable';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
