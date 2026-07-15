<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Country\StoreCountryRequest;
use App\Http\Requests\Country\UpdateCountryRequest;
use App\Http\Resources\CountryResource;
use App\Models\Country;
use App\Services\CountryService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CountryController extends Controller
{
    public function __construct(private CountryService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            CountryResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StoreCountryRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateCountryRequest $request, Country $country)
    {
        return ApiResponse::success(
            $this->service->update($country, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(Country $country)
    {
        $this->service->delete($country);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
