<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Tenant\StoreTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\TenantService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantController extends Controller
{
    public function __construct(private TenantService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            TenantResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreTenantRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function show(Tenant $tenant)
    {
        return ApiResponse::success(
            $this->service->show($tenant),
            ResponseMessage::FETCHED,
        );
    }

    public function suspend(Tenant $tenant)
    {
        return ApiResponse::success(
            $this->service->setStatus($tenant, 'suspended'),
            ResponseMessage::UPDATED,
        );
    }

    public function activate(Tenant $tenant)
    {
        return ApiResponse::success(
            $this->service->setStatus($tenant, 'active'),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Tenant $tenant)
    {
        $this->service->delete($tenant);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
