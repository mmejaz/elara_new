<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\LeaveType\StoreLeaveTypeRequest;
use App\Http\Requests\LeaveType\UpdateLeaveTypeRequest;
use App\Http\Resources\LeaveTypeResource;
use App\Models\LeaveType;
use App\Services\LeaveTypeService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LeaveTypeController extends Controller
{
    public function __construct(private LeaveTypeService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            LeaveTypeResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreLeaveTypeRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateLeaveTypeRequest $request, LeaveType $leaveType)
    {
        return ApiResponse::success(
            $this->service->update($leaveType, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(LeaveType $leaveType)
    {
        $this->service->delete($leaveType);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
