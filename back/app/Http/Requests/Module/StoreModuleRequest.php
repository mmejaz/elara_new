<?php

namespace App\Http\Requests\Module;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Module generation writes executable code and runs migrations —
        // restrict it to Super Admin only.
        return $this->user()?->hasRole('Super Admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255', 'regex:/^[A-Za-z ]+$/', 'unique:modules,name'],
            'type'        => ['required', Rule::in(['item', 'group'])],
            'resourceful' => ['boolean'],
            'parent'      => ['nullable', 'string'],
            'icon'        => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(['view', 'create', 'edit', 'delete', 'export'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Module name is required.',
            'name.regex'    => 'Module name may only contain letters and spaces.',
            'name.unique'   => 'A module with this name already exists.',
            'type.in'       => 'Invalid module type.',
        ];
    }
}
