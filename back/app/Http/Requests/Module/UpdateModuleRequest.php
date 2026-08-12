<?php

namespace App\Http\Requests\Module;

use Illuminate\Foundation\Http\FormRequest;

class UpdateModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Toggling module visibility is something a tenant owner does for their
        // own sidebar, and tenant owners hold "Admin" rather than "Super Admin".
        // Which modules are visible at all is still bounded by the global scope
        // in App\Models\Module, so this cannot surface a central-only module.
        return $this->user()?->hasAnyRole(['Super Admin', 'Admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'is_visible' => ['required', 'boolean'],
        ];
    }
}
