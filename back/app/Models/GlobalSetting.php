<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class GlobalSetting extends Model
{
    public function fields(): HasMany
    {
        return $this->hasMany(GlobalSettingField::class)->orderBy('sort_order')->orderBy('id');
    }

    public function records(): HasMany
    {
        return $this->hasMany(GlobalSettingRecord::class);
    }
}
