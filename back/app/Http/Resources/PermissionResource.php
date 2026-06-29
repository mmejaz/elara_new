<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $parts = explode(' ', $this->name, 2);

        return [
            'id'     => $this->id,
            'name'   => $this->name,
            'action' => $parts[0] ?? '',
            'module' => isset($parts[1]) ? ucfirst($parts[1]) : '',
            'roles'  => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
        ];
    }
}
