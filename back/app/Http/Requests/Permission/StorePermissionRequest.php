<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'unique:permissions,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Permission name is required.',
            'name.unique'   => 'This permission already exists.',
        ];
    }
}
