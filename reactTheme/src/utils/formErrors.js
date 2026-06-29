/**
 * Takes a Laravel validation error response and sets field-level errors
 * on an antd Form instance.
 *
 * Laravel returns: { errors: { field: ['message', ...] } }
 *
 * Returns true if any field errors were set, false if only a general error.
 */
export function applyServerErrors(error, form) {
  const errors = error?.response?.data?.errors

  if (errors && typeof errors === 'object') {
    form.setFields(
      Object.entries(errors).map(([field, messages]) => ({
        name: field,
        errors: Array.isArray(messages) ? messages : [messages],
      })),
    )
    return true
  }

  return false
}

/**
 * Returns the general error message from a server response,
 * falling back to the provided default.
 */
export function serverMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message ?? fallback
}
