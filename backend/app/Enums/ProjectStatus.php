<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Concept = 'concept';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Maintained = 'maintained';
    case Paused = 'paused';
    case Archived = 'archived';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
