'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { Search, Users, Bookmark, Sparkles, Target, Loader2, ArrowRight, TrendingUp } from 'lucide-react'

export default function RecruiterDashboard() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getCurrentUser()
        setUser(response.data.user)
        
        if (response.data.user.role !== 'recruiter') {
          router.push('/employer/dashboard')
          return
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, setUser])

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
                  Welcome back, {user?.name}! 🎯
                </h1>
                <p className="text-lg text-muted-foreground">
                  Discover and connect with top talent using AI-powered search
                </p>
              </div>
              <Button size="lg" className="btn-gradient shadow-lg" onClick={() => router.push('/recruiter/search')}>
                <Search className="w-5 h-5 mr-2" />
                Find Candidates
              </Button>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            label="Total Candidates"
            value="1,234"
            change={15}
            changeLabel="new this week"
            icon={Users}
            color="blue"
          />
          <MetricCard
            label="Bookmarked"
            value="47"
            icon={Bookmark}
            color="orange"
          />
          <MetricCard
            label="Matches"
            value="89"
            change={24}
            changeLabel="vs last week"
            icon={Target}
            color="green"
          />
          <MetricCard
            label="Success Rate"
            value="94%"
            change={8}
            changeLabel="improvement"
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="card-hover border-0 shadow-soft group cursor-pointer" onClick={() => router.push('/recruiter/search')}>
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl mb-2">Search Candidates</CardTitle>
                <CardDescription className="text-sm">
                  Find the perfect match with advanced filters and AI-powered recommendations
                </CardDescription>
              </div>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-white transition-colors">
                Start Searching
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
          </Card>

          <Card className="card-hover border-0 shadow-soft group cursor-pointer" onClick={() => router.push('/recruiter/bookmarks')}>
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl mb-2">Saved Candidates</CardTitle>
                <CardDescription className="text-sm">
                  View and manage your bookmarked candidate profiles
                </CardDescription>
              </div>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-white transition-colors">
                View Bookmarks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
          </Card>

          <Card className="card-hover border-0 shadow-soft group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <Badge variant="success" className="mb-2">AI Powered</Badge>
                <CardTitle className="text-xl mb-2">Smart Matching</CardTitle>
                <CardDescription className="text-sm">
                  Get AI recommendations based on your search history
                </CardDescription>
              </div>
              <Button className="w-full btn-gradient justify-between">
                See Recommendations
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
          </Card>
        </div>

        {/* Getting Started Guide - Modern design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info section */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl">Getting Started</CardTitle>
              <CardDescription className="text-base">
                Follow these steps to find the best talent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Search for Candidates</h4>
                    <p className="text-sm text-muted-foreground">
                      Use advanced filters to find candidates by skills, location, experience, and more
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Review Profiles</h4>
                    <p className="text-sm text-muted-foreground">
                      View detailed candidate profiles with comprehensive work history and skills
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Bookmark and Organize</h4>
                    <p className="text-sm text-muted-foreground">
                      Save interesting candidates and add notes for future reference
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="w-full btn-gradient"
                  onClick={() => router.push('/recruiter/search')}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Start Your Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <Badge variant="info">Pro Tips</Badge>
              </div>
              <CardTitle className="text-2xl">Recruitment Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border">
                  <h5 className="font-semibold mb-1">🎯 Use Specific Keywords</h5>
                  <p className="text-sm text-muted-foreground">
                    Search with specific skills and technologies for better matches
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border">
                  <h5 className="font-semibold mb-1">⭐ Bookmark Early</h5>
                  <p className="text-sm text-muted-foreground">
                    Save promising candidates immediately to build your talent pipeline
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border">
                  <h5 className="font-semibold mb-1">📊 Check Experience</h5>
                  <p className="text-sm text-muted-foreground">
                    Review work history and education for qualified candidates
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border">
                  <h5 className="font-semibold mb-1">🤖 Use AI Matching</h5>
                  <p className="text-sm text-muted-foreground">
                    Let our AI recommend candidates based on your requirements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

