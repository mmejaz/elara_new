<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');
        return auth()->user()->can('update', $role);
    }

    public function rules(): array
    {
        $roleId = $this->route('role')->id;

        return [
            'name'          => ['required', 'string', 'max:255', 'unique:roles,name,' . $roleId],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Role name is required.',
            'name.unique'   => 'A role with this name already exists.',
        ];
    }
}
