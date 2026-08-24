<?php

namespace App\Http\Requests\User;

use App\Rules\AssignableRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->route('user');
        return auth()->user()->can('update', $user);
    }

    public function rules(): array
    {
        $id = $this->route('user')->id;

        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email,' . $id],
            'password' => ['nullable', 'string', Password::defaults()],
            'role'     => ['required', 'string', 'exists:roles,name', new AssignableRole],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'joining_date'  => ['nullable', 'date'],
            // Every user must belong to at least one organization.
            'organization_ids'   => ['required', 'array', 'min:1'],
            'organization_ids.*' => ['integer', 'exists:organizations,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already taken.',
            'role.exists'  => 'The selected role is invalid.',
            'department_id.required' => 'Please select a department.',
            'department_id.exists'   => 'The selected department does not exist.',
            'organization_ids.required' => 'Please assign at least one organization.',
            'organization_ids.min'      => 'Please assign at least one organization.',
        ];
    }
}
