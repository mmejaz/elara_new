<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'designation' => $this->designation,
            'country'     => $this->country,
            'city'        => $this->city,
            'bio'         => $this->bio,
            'settings'    => $this->settings ?? [],
            'avatar'      => $this->fileIn('avatar')?->url,
            'roles'       => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            'created_at'  => $this->created_at->toDateString(),
        ];
    }
}
