import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
})

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; name: string; role: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  selectRole: (role: string) => api.post('/auth/select-role', { role }),
}

// Jobs API
export const jobsApi = {
  getAll: () => api.get('/jobs'),
  
  getById: (id: string) => api.get(`/jobs/${id}`),
  
  create: (data: any) => api.post('/jobs', data),
  
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  
  delete: (id: string) => api.delete(`/jobs/${id}`),
  
  getStats: (id: string) => api.get(`/jobs/${id}/stats`),
}

// Applications API
export const applicationsApi = {
  getForJob: (jobId: string) => api.get(`/applications/job/${jobId}`),
  
  getById: (id: string) => api.get(`/applications/${id}`),
  
  submit: (data: any) => api.post('/applications/submit', data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/applications/${id}/status`, { status }),
  
  delete: (id: string) => api.delete(`/applications/${id}`),
}

// Candidates API
export const candidatesApi = {
  search: (params: any) => api.get('/candidates/search', { params }),
  
  getById: (id: string) => api.get(`/candidates/${id}`),
  
  bookmark: (id: string, notes?: string) =>
    api.post(`/candidates/${id}/bookmark`, { notes }),
  
  removeBookmark: (id: string) => api.delete(`/candidates/${id}/bookmark`),
  
  getBookmarks: () => api.get('/candidates/bookmarks/list'),
}

// ML API
export const mlApi = {
  rankCandidates: (jobId: string) => api.post(`/ml/rank/${jobId}`),
  
  checkHealth: () => api.get('/ml/health'),
}

export default api

