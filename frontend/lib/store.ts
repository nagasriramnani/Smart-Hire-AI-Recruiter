import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: 'employer' | 'recruiter'
  avatar?: string
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

interface Job {
  id: string
  title: string
  description?: string
  company_name?: string
  location?: string
  status: string
  application_count: number
}

interface JobsStore {
  jobs: Job[]
  selectedJob: Job | null
  setJobs: (jobs: Job[]) => void
  setSelectedJob: (job: Job | null) => void
  addJob: (job: Job) => void
  updateJob: (id: string, job: Partial<Job>) => void
  deleteJob: (id: string) => void
}

export const useJobsStore = create<JobsStore>((set) => ({
  jobs: [],
  selectedJob: null,
  setJobs: (jobs) => set({ jobs }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (id, updatedJob) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updatedJob } : job)),
    })),
  deleteJob: (id) => set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),
}))

