import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
})

/**
 * File uploads send a FormData body. The JSON content type above would override
 * the multipart type (and drop its boundary), so the server would receive no
 * file — strip it and let the browser set `multipart/form-data; boundary=…`.
 */
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

export const initCsrf = () =>
  axios.get(`${import.meta.env.VITE_BACKEND_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })

export default apiClient
