'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { useAuthStore, useJobsStore } from '@/lib/store'
import { authApi, jobsApi } from '@/lib/api'
import { Briefcase, Users, FileText, Plus, TrendingUp, Sparkles, Clock, Loader2, ArrowRight } from 'lucide-react'

export default function EmployerDashboard() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { jobs, setJobs } = useJobsStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalJobs: 0,
    publishedJobs: 0,
    totalApplications: 0
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getCurrentUser()
        setUser(response.data.user)
        
        if (response.data.user.role !== 'employer') {
          router.push('/recruiter/dashboard')
          return
        }
        
        // Fetch jobs
        const jobsResponse = await jobsApi.getAll()
        setJobs(jobsResponse.data.jobs)
        
        // Calculate stats
        const jobsList = jobsResponse.data.jobs
        setStats({
          totalJobs: jobsList.length,
          publishedJobs: jobsList.filter((j: any) => j.status === 'published').length,
          totalApplications: jobsList.reduce((sum: number, j: any) => sum + (j.application_count || 0), 0)
        })
        
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, setUser, setJobs])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome section with gradient */}
        <div className="relative overflow-hidden rounded-2xl gradient-mesh p-8 border">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage your job postings and review applications with AI-powered insights
                </p>
              </div>
              <Button size="lg" className="btn-gradient shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Create New Job
              </Button>
            </div>
          </div>
        </div>

        {/* Stats cards with modern design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            label="Total Jobs"
            value={stats.totalJobs}
            change={12}
            changeLabel="vs last month"
            icon={Briefcase}
            color="blue"
          />
          <MetricCard
            label="Applications"
            value={stats.totalApplications}
            change={stats.totalApplications > 50 ? 24 : -8}
            changeLabel="vs last month"
            icon={FileText}
            color="green"
          />
          <MetricCard
            label="Published"
            value={stats.publishedJobs}
            icon={TrendingUp}
            color="purple"
          />
          <MetricCard
            label="Avg per Job"
            value={stats.totalJobs > 0 ? Math.round(stats.totalApplications / stats.totalJobs) : 0}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Quick actions - Modern cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="card-hover border-0 shadow-soft group cursor-pointer" onClick={() => router.push('/employer/jobs/new')}>
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl mb-2">Create New Job</CardTitle>
                <CardDescription className="text-sm">
                  Post a new job with custom application forms and AI-powered ATS
                </CardDescription>
              </div>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-white transition-colors">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
          </Card>

          <Card className="card-hover border-0 shadow-soft group cursor-pointer" onClick={() => router.push('/employer/jobs')}>
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl mb-2">Manage Jobs</CardTitle>
                <CardDescription className="text-sm">
                  View, edit, and manage all your active job postings
                </CardDescription>
              </div>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-white transition-colors">
                View All Jobs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
          </Card>

          <Card className="card-hover border-0 shadow-soft group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <Badge variant="warning" className="mb-2">New Feature</Badge>
                <CardTitle className="text-xl mb-2">AI Resume Scoring</CardTitle>
                <CardDescription className="text-sm">
                  Let AI rank candidates based on your requirements
                </CardDescription>
              </div>
              <Button className="w-full btn-gradient justify-between">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
          </Card>
        </div>

        {/* Recent jobs - Modern table design */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Recent Jobs</CardTitle>
                <CardDescription className="text-base mt-1">
                  Your latest job postings and their performance
                </CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href="/employer/jobs">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No jobs yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first job posting to start receiving applications from talented candidates
                </p>
                <Button asChild size="lg" className="btn-gradient">
                  <Link href="/employer/jobs/new">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Job
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-5 rounded-xl hover:bg-secondary/50 transition-all cursor-pointer border border-transparent hover:border-primary/20 group"
                    onClick={() => router.push(`/employer/jobs/${job.id}`)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {job.title}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            📍 {job.location}
                          </span>
                          <span>•</span>
                          <span>{job.job_type}</span>
                          <span>•</span>
                          <Badge variant={job.status === 'published' ? 'success' : 'warning'} className="capitalize">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {job.application_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Applications</div>
                      </div>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-white transition-colors">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

