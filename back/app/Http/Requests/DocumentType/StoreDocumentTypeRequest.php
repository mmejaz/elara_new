<?php

namespace App\Http\Requests\DocumentType;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->can('create', DocumentType::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:document_types,name'],
        ];
    }
}
