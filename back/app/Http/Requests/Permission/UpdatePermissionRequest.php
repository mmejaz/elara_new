<?php

namespace App\Http\Requests\Permission;

use App\Models\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $permission = $this->route('permission');
        return auth()->user()->can('update', $permission);
    }

    public function rules(): array
    {
        $permission = $this->route('permission');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                // Every permission has TWO rows (the `web` and `sanctum` guard
                // twins) sharing one name, so ignoring the bound id alone still
                // trips on the twin. Ignore by name instead — this excludes both
                // twins and still catches a collision with a *different* name.
                Rule::unique('permissions', 'name')->ignore($permission->name, 'name'),
            ],
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
