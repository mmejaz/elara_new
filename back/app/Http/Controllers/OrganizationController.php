<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Organization\StoreOrganizationRequest;
use App\Http\Requests\Organization\UpdateOrganizationRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Services\OrganizationService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrganizationController extends Controller
{
    public function __construct(private OrganizationService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            OrganizationResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreOrganizationRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateOrganizationRequest $request, Organization $organization)
    {
        return ApiResponse::success(
            $this->service->update($organization, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Organization $organization)
    {
        $this->service->delete($organization);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
