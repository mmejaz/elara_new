/** The standard API envelope every endpoint returns (see App\Helpers\ApiResponse). */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
}

/** Shape of a Laravel validation/error payload as seen by the axios catch block. */
export interface ApiError {
  response?: {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
}
