<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DepartmentController extends Controller
{
    public function __construct(private DepartmentService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            DepartmentResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreDepartmentRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        return ApiResponse::success(
            $this->service->update($department, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Department $department)
    {
        $this->service->delete($department);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
