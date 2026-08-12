<?php

namespace App\Http\Requests\DocumentType;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $documentType = $this->route('documentType');
        return auth()->user()->can('update', $documentType);
    }

    public function rules(): array
    {
        $id = $this->route('documentType')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:document_types,name,' . $id],
        ];
    }
}
