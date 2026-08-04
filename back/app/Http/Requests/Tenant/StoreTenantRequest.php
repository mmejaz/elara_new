<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            // Full host the tenant is reached at, e.g. school1.elara.test.
            'domain'         => ['required', 'string', 'max:255', 'regex:/^[a-z0-9.-]+$/', 'unique:domains,domain'],
            // Optional explicit tenant id → also the DB-name suffix. Locked to a
            // safe charset so it can never inject into CREATE DATABASE.
            'id'             => ['nullable', 'string', 'max:60', 'regex:/^[a-z0-9_]+$/', 'unique:tenants,id'],
            'admin_name'     => ['nullable', 'string', 'max:255'],
            'admin_email'    => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', Password::defaults()],
            'email'          => ['nullable', 'email', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'timezone'       => ['nullable', 'string', 'max:64'],
            'currency'       => ['nullable', 'string', 'max:8'],
            'language'       => ['nullable', 'string', 'max:8'],
            'status'         => ['nullable', 'in:active,suspended'],
        ];
    }

    public function messages(): array
    {
        return [
            'domain.unique' => 'That domain is already taken.',
            'domain.regex'  => 'Use a valid hostname (letters, numbers, dots and hyphens).',
            'id.regex'      => 'The id may only contain lowercase letters, numbers and underscores.',
        ];
    }
}
