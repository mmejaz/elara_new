<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
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
        $role = $this->route('role');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                // Every role has TWO rows (the `web` and `sanctum` guard twins)
                // sharing one name, so ignoring the bound id alone still trips on
                // the twin. Ignore by name instead — this excludes both twins and
                // still catches a collision with a *different* role's name.
                Rule::unique('roles', 'name')->ignore($role->name, 'name'),
            ],
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
