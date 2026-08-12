<?php

namespace App\Http\Requests\Permission;

use App\Models\Permission;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $permission = $this->route('permission');
        return auth()->user()->can('update', $permission);
    }

    public function rules(): array
    {
        $permissionId = $this->route('permission')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name,' . $permissionId],
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
