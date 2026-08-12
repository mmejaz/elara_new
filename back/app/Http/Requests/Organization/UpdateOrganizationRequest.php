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
            'name'      => ['required', 'string', 'max:255', 'unique:organizations,name,' . $id],
            'parent_id' => [
                'nullable',
                'integer',
                'exists:organizations,id',
                // An organization can be neither its own parent nor a child of one
                // of its own descendants (which would create a cycle).
                function (string $attribute, $value, \Closure $fail) use ($id): void {
                    if ((int) $value === (int) $id) {
                        $fail('An organization cannot be its own parent.');

                        return;
                    }

                    // Walk up from the chosen parent; reaching this organization
                    // means the chosen parent lives inside its subtree.
                    $ancestor = Organization::find($value);
                    $guard = 0;

                    while ($ancestor && $guard++ < 100) {
                        if ((int) $ancestor->id === (int) $id) {
                            $fail('Cannot set a descendant organization as the parent (circular hierarchy).');

                            return;
                        }

                        $ancestor = $ancestor->parent_id ? Organization::find($ancestor->parent_id) : null;
                    }
                },
            ],
        ];
    }
}
