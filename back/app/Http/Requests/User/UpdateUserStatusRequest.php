<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                User::STATUS_ACTIVE,
                User::STATUS_DEACTIVATED,
                User::STATUS_BLOCKED,
            ])],
            // A reason is required whenever the account is being deactivated or
            // blocked; it's optional (and cleared) when reactivating.
            'reason' => [
                Rule::requiredIf(fn () => in_array(
                    $this->input('status'),
                    [User::STATUS_DEACTIVATED, User::STATUS_BLOCKED],
                    true,
                )),
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in'       => 'Invalid status.',
            'reason.required' => 'Please provide a reason.',
        ];
    }
}
