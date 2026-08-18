<?php

namespace App\Helpers;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiResponse
{
    /**
     * Standard envelope for a paginated list: rows in `data`, page info in `meta`.
     * Pass the paginator and the Resource class used to transform each row.
     */
    public static function paginated(
        LengthAwarePaginator $paginator,
        string $resourceClass,
        string $message = 'Success'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $resourceClass::collection($paginator->items()),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
            'errors'  => null,
        ]);
    }

    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $status = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'errors'  => null,
        ], $status);
    }

    /**
     * A failure the client resolves by navigating somewhere else. Kept in the
     * same envelope as error() — `success` is still false and the status is a
     * real error code — because a 3xx would be followed by XHR transparently,
     * hiding the failure from the SPA.
     *
     * `host` is the bare hostname, for clients that keep their own scheme and
     * port and swap only the host.
     */
    public static function redirect(
        string $url,
        string $host,
        string $message,
        int $status = Response::HTTP_NOT_FOUND
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data'    => [
                'redirect_url' => $url,
                'central_host' => $host,
            ],
            'errors'  => null,
        ], $status);
    }

    public static function error(
        string $message,
        mixed $errors = null,
        int $status = Response::HTTP_BAD_REQUEST
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data'    => null,
            'errors'  => $errors,
        ], $status);
    }
}
