<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardWidget extends Model
{
    protected $fillable = ['key', 'label', 'icon', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean'];
}
