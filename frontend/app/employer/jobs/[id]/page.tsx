'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { jobsApi, applicationsApi, mlApi } from '@/lib/api'
import { ArrowLeft, Loader2, Sparkles, MapPin, Briefcase, Clock, TrendingUp, Mail, Phone } from 'lucide-react'

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState(false)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        jobsApi.getById(jobId),
        applicationsApi.getForJob(jobId)
      ])
      setJob(jobRes.data.job)
      setApplications(appsRes.data.applications)
    } catch (error) {
      console.error('Failed to fetch job details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRankCandidates = async () => {
    setRanking(true)
    try {
      const response = await mlApi.rankCandidates(jobId)
      
      if (response.data.success) {
        // Refresh applications to get updated rankings
        const appsRes = await applicationsApi.getForJob(jobId)
        setApplications(appsRes.data.applications)
        alert('Candidates ranked successfully!')
      }
    } catch (error) {
      console.error('Failed to rank candidates:', error)
      alert('Failed to rank candidates. Please try again.')
    } finally {
      setRanking(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                    job.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <CardDescription>{job.company_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {job.location}
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {job.job_type}
                  </div>
                )}
                {job.salary_range && (
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {job.salary_range}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </div>

                {job.description && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{job.description}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button className="w-full" variant="outline" onClick={() => router.push(`/employer/jobs/${jobId}/edit`)}>
                    Edit Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Applications ({applications.length})</CardTitle>
                    <CardDescription>Review and rank candidate applications</CardDescription>
                  </div>
                  <Button onClick={handleRankCandidates} disabled={ranking || applications.length === 0}>
                    {ranking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ranking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Rank with AI
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-600">Applications will appear here once candidates start applying</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-lg">{app.candidate_name}</h4>
                              {app.rank_score && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(app.rank_score)}`}>
                                  Score: {Math.round(app.rank_score)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {app.candidate_email}
                              </div>
                              <div className="text-xs">
                                Applied {new Date(app.submitted_at).toLocaleDateString()}
                              </div>
                            </div>

                            {app.rank_rationale && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-sm text-blue-900">
                                  <strong>AI Analysis:</strong> {app.rank_rationale}
                                </p>
                              </div>
                            )}

                            {/* Application Data */}
                            {app.candidate_data && (
                              <div className="mt-3 pt-3 border-t">
                                <details className="text-sm">
                                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                    View Application Details
                                  </summary>
                                  <div className="mt-2 space-y-2 pl-4">
                                    {Object.entries(app.candidate_data).map(([key, value]: [string, any]) => (
                                      <div key={key}>
                                        <span className="font-medium text-gray-700">{key}:</span>{' '}
                                        <span className="text-gray-600">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

