<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['global_setting_id', 'label', 'key', 'type', 'options', 'is_required', 'sort_order'])]
class GlobalSettingField extends Model
{
    protected function casts(): array
    {
        return [
            'options'     => 'array',
            'is_required' => 'boolean',
        ];
    }

    public function globalSetting(): BelongsTo
    {
        return $this->belongsTo(GlobalSetting::class);
    }
}
