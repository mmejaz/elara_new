<?php

namespace App\Http\Requests\User;

use App\Rules\AssignableRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
            'role'     => ['required', 'string', 'exists:roles,name', new AssignableRole],
            // Every user is assigned to a department on creation.
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'joining_date'  => ['nullable', 'date'],
            // Organizations this user may access (ignored for a Super Admin, who
            // sees all). Empty = assigned to none.
            // Every user must belong to at least one organization.
            'organization_ids'   => ['required', 'array', 'min:1'],
            'organization_ids.*' => ['integer', 'exists:organizations,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Full name is required.',
            'email.required'    => 'Email address is required.',
            'email.email'       => 'Please enter a valid email address.',
            'email.unique'      => 'This email address is already taken.',
            'password.required' => 'Password is required.',
            'password.min'      => 'Password must be at least 8 characters.',
            'role.required'     => 'Please select a role.',
            'role.exists'       => 'The selected role does not exist.',
            'department_id.required' => 'Please select a department.',
            'department_id.exists'   => 'The selected department does not exist.',
            'organization_ids.required' => 'Please assign at least one organization.',
            'organization_ids.min'      => 'Please assign at least one organization.',
        ];
    }
}
