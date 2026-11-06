<?php

namespace App\Enums;

enum EmploymentType: string
{
    case Job = 'job';
    case Internship = 'internship';
    case Freelance = 'freelance';
    case Volunteer = 'volunteer';
    case Academic = 'academic';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
