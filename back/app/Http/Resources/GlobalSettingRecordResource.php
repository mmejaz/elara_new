<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GlobalSettingRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'data'       => $this->data ?? [],
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
