'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { jobsApi } from '@/lib/api'
import { Plus, Briefcase, MapPin, Clock, FileText, Loader2, Eye, Edit, Trash2 } from 'lucide-react'

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await jobsApi.getAll()
      setJobs(response.data.jobs)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await jobsApi.delete(jobId)
      setJobs(jobs.filter((job: any) => job.id !== jobId))
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('Failed to delete job')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      closed: 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || styles.draft
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and applications</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => router.push('/employer/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push('/employer/jobs/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>

        {/* Jobs grid */}
        {jobs.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-600 mb-6">Create your first job posting to start receiving applications</p>
              <Button onClick={() => router.push('/employer/jobs/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Status badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/employer/jobs/${job.id}`)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => router.push(`/employer/jobs/${job.id}/edit`)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Job info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {job.title}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    {job.company_name && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 mr-2" />
                        {job.company_name}
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {job.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Applications count */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2 text-primary" />
                        <span className="font-semibold text-gray-900">{job.application_count || 0}</span>
                        <span className="text-gray-600 ml-1">applications</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/employer/jobs/${job.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

