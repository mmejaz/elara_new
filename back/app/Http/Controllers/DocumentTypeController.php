<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\DocumentType\StoreDocumentTypeRequest;
use App\Http\Requests\DocumentType\UpdateDocumentTypeRequest;
use App\Http\Resources\DocumentTypeResource;
use App\Models\DocumentType;
use App\Services\DocumentTypeService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DocumentTypeController extends Controller
{
    public function __construct(private DocumentTypeService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            DocumentTypeResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreDocumentTypeRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateDocumentTypeRequest $request, DocumentType $documentType)
    {
        return ApiResponse::success(
            $this->service->update($documentType, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(DocumentType $documentType)
    {
        $this->service->delete($documentType);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
