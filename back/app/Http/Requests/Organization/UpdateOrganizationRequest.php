<?php

namespace App\Http\Requests\Organization;

use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $organization = $this->route('organization');
        return auth()->user()->can('update', $organization);
    }

    public function rules(): array
    {
        $id = $this->route('organization')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:organizations,name,' . $id],
        ];
    }
}
