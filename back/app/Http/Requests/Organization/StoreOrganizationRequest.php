<?php

namespace App\Http\Requests\Organization;

use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->can('create', Organization::class);
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255', 'unique:organizations,name'],
            'parent_id' => ['nullable', 'integer', 'exists:organizations,id'],
        ];
    }
}
