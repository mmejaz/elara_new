<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\City\StoreCityRequest;
use App\Http\Requests\City\UpdateCityRequest;
use App\Models\City;
use App\Services\CityService;
use Symfony\Component\HttpFoundation\Response;

class CityController extends Controller
{
    public function __construct(private CityService $service) {}

    public function index()
    {
        return ApiResponse::success($this->service->getAll(), ResponseMessage::FETCHED);
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
