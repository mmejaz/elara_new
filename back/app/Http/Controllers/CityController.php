<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\City\StoreCityRequest;
use App\Http\Requests\City\UpdateCityRequest;
use App\Http\Resources\CityResource;
use App\Models\City;
use App\Services\CityService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CityController extends Controller
{
    public function __construct(private CityService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            CityResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreCityRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateCityRequest $request, City $city)
    {
        return ApiResponse::success(
            $this->service->update($city, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(City $city)
    {
        $this->service->delete($city);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
