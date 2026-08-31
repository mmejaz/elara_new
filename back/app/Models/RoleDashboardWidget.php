<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleDashboardWidget extends Model
{
    protected $fillable = ['role_id', 'widget_key', 'is_visible'];

    protected $casts = ['is_visible' => 'boolean'];
}
