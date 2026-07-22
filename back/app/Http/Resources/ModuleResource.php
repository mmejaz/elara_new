<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'          => $this->name,
            'slug'          => $this->slug,
            'icon'          => $this->icon,
            'type'          => $this->type,
            'is_resourceful' => $this->is_resourceful,
            'parent_id'     => $this->parent_id,
            'order'         => $this->order,
            'is_visible'    => $this->is_visible,
            'is_system'     => $this->is_system,
            'description'   => $this->description,
            'permissions'   => $this->type === 'item' && $this->is_resourceful
                ? $this->permissionNames()
                : [],
            'children'      => ModuleResource::collection($this->whenLoaded('childrenRecursive')),
        ];
    }
}
