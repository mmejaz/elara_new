<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['global_setting_id', 'data'])]
class GlobalSettingRecord extends Model
{
    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    public function globalSetting(): BelongsTo
    {
        return $this->belongsTo(GlobalSetting::class);
    }
}
