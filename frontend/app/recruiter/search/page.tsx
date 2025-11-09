'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { candidatesApi } from '@/lib/api'
import { Search, MapPin, Briefcase, GraduationCap, Bookmark, BookmarkCheck, Loader2, Filter } from 'lucide-react'

export default function RecruiterSearchPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  const [filters, setFilters] = useState({
    query: '',
    skills: '',
    location: '',
    experience_min: '',
    experience_max: '',
    available: 'true'
  })

  useEffect(() => {
    searchCandidates()
  }, [])

  const searchCandidates = async () => {
    setLoading(true)
    try {
      // Remove empty filters
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const response = await candidatesApi.search(params)
      setCandidates(response.data.candidates)
    } catch (error) {
      console.error('Failed to search candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (candidateId: string) => {
    try {
      if (bookmarked.has(candidateId)) {
        await candidatesApi.removeBookmark(candidateId)
        setBookmarked(prev => {
          const next = new Set(prev)
          next.delete(candidateId)
          return next
        })
      } else {
        await candidatesApi.bookmark(candidateId)
        setBookmarked(prev => new Set(prev).add(candidateId))
      }
    } catch (error) {
      console.error('Failed to bookmark candidate:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchCandidates()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Candidates</h1>
              <p className="text-gray-600 mt-2">Find the perfect match for your needs</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/recruiter/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Search by name or bio..."
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Skills</label>
                  <Input
                    placeholder="e.g. React, Python, AWS"
                    value={filters.skills}
                    onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="e.g. San Francisco, Remote"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience (years)</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.experience_min}
                      onChange={(e) => setFilters({ ...filters, experience_min: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.experience_max}
                      onChange={(e) => setFilters({ ...filters, experience_max: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.available === 'true'}
                    onChange={(e) => setFilters({ ...filters, available: e.target.checked ? 'true' : 'false' })}
                    className="rounded border-gray-300"
                  />
                  <span>Available candidates only</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      query: '',
                      skills: '',
                      location: '',
                      experience_min: '',
                      experience_max: '',
                      available: 'true'
                    })
                    searchCandidates()
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} Found
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : candidates.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-600">Try adjusting your search filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                      </div>
                      <button
                        onClick={() => handleBookmark(candidate.id)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        {bookmarked.has(candidate.id) ? (
                          <BookmarkCheck className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {candidate.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{candidate.bio}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {candidate.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          {candidate.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                        {candidate.experience_years} years experience
                      </div>
                      {candidate.available ? (
                        <div className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Available
                        </div>
                      ) : (
                        <div className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Not Available
                        </div>
                      )}
                    </div>

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 4).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 4 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                              +{candidate.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <Button variant="outline" className="w-full" size="sm">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

