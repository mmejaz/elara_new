<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'email_notifications' => ['required', 'boolean'],
            'product_updates'     => ['required', 'boolean'],
            'profile_public'      => ['required', 'boolean'],
        ];
    }
}
