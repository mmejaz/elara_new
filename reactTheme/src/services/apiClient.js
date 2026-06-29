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

export const initCsrf = () =>
  axios.get(`${import.meta.env.VITE_BACKEND_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })

export default apiClient
