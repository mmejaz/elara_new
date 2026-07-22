<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Names are "{module}.{action}" with underscores for spaces,
        // e.g. "user_info.view_data".
        [$module, $action] = array_pad(explode('.', $this->name, 2), 2, '');

        return [
            'id'     => $this->id,
            'name'   => $this->name,
            'action' => $action,
            'module' => $module ? Str::headline($module) : '',
            'roles'  => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
        ];
    }
}
