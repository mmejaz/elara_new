<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Gender\StoreGenderRequest;
use App\Http\Requests\Gender\UpdateGenderRequest;
use App\Http\Resources\GenderResource;
use App\Models\Gender;
use App\Services\GenderService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GenderController extends Controller
{
    public function __construct(private GenderService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            GenderResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreGenderRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateGenderRequest $request, Gender $gender)
    {
        return ApiResponse::success(
            $this->service->update($gender, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Gender $gender)
    {
        $this->service->delete($gender);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
