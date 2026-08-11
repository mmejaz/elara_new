<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Designation\StoreDesignationRequest;
use App\Http\Requests\Designation\UpdateDesignationRequest;
use App\Http\Resources\DesignationResource;
use App\Models\Designation;
use App\Services\DesignationService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DesignationController extends Controller
{
    public function __construct(private DesignationService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            DesignationResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreDesignationRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateDesignationRequest $request, Designation $designation)
    {
        return ApiResponse::success(
            $this->service->update($designation, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Designation $designation)
    {
        $this->service->delete($designation);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
