<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'string', 'exists:roles,name'],
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
        ];
    }
}
