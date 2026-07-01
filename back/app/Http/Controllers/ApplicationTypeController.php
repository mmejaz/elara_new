<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\ApplicationType\StoreApplicationTypeRequest;
use App\Http\Requests\ApplicationType\UpdateApplicationTypeRequest;
use App\Models\ApplicationType;
use App\Services\ApplicationTypeService;
use Symfony\Component\HttpFoundation\Response;

class ApplicationTypeController extends Controller
{
    public function __construct(private ApplicationTypeService $service) {}

    public function index()
    {
        return ApiResponse::success($this->service->getAll(), ResponseMessage::FETCHED);
    }

    public function store(StoreApplicationTypeRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateApplicationTypeRequest $request, ApplicationType $applicationType)
    {
        return ApiResponse::success(
            $this->service->update($applicationType, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(ApplicationType $applicationType)
    {
        $this->service->delete($applicationType);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
