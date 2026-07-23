<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Tenant\StoreTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\TenantService;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function __construct(private TenantService $tenants) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->tenants->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            TenantResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreTenantRequest $request)
    {
        $tenant = $this->tenants->create($request->validated());

        return ApiResponse::success(
            new TenantResource($tenant),
            ResponseMessage::CREATED,
            \Symfony\Component\HttpFoundation\Response::HTTP_CREATED,
        );
    }

    public function show(Tenant $tenant)
    {
        return ApiResponse::success(
            new TenantResource($tenant->load('domains')),
            ResponseMessage::FETCHED,
        );
    }

    public function suspend(Tenant $tenant)
    {
        return ApiResponse::success(
            new TenantResource($this->tenants->setStatus($tenant, 'suspended')),
            ResponseMessage::UPDATED,
        );
    }

    public function activate(Tenant $tenant)
    {
        return ApiResponse::success(
            new TenantResource($this->tenants->setStatus($tenant, 'active')),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Tenant $tenant)
    {
        $this->tenants->delete($tenant);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
