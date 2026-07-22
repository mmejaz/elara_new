<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GlobalSettingFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'label'       => $this->label,
            'key'         => $this->key,
            'type'        => $this->type,
            'options'     => $this->options ?? [],
            'is_required' => (bool) $this->is_required,
            'sort_order'  => $this->sort_order,
        ];
    }
}
