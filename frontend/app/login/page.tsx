'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Briefcase } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employer'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const response = await authApi.login(formData.email, formData.password)
        setUser(response.data.user)
        
        // Redirect based on role
        if (response.data.user.role === 'employer') {
          router.push('/employer/dashboard')
        } else {
          router.push('/recruiter/dashboard')
        }
      } else {
        const response = await authApi.register(formData)
        setUser(response.data.user)
        
        // Redirect based on role
        if (formData.role === 'employer') {
          router.push('/employer/dashboard')
        } else {
          router.push('/recruiter/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex gradient-mesh">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-purple-700 p-12 flex-col justify-between">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">SmartHire</h1>
              <p className="text-sm text-white/80">AI-Powered Recruitment</p>
            </div>
          </div>

          <div className="space-y-6 mt-16">
            <div className="glass-dark rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Find Perfect Matches 🎯
              </h2>
              <p className="text-white/80">
                Use AI-powered tools to connect employers with the best candidates. Everything runs locally, keeping your data secure.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✓</span>
                </div>
                <p className="text-white/90">100% Local & Privacy-First</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✓</span>
                </div>
                <p className="text-white/90">AI-Powered Resume Scoring</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✓</span>
                </div>
                <p className="text-white/90">Smart Candidate Matching</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✓</span>
                </div>
                <p className="text-white/90">Custom Application Forms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">
                Smart<span className="text-primary">Hire</span>
              </h1>
            </div>
          </div>

          <Card className="border-0 shadow-soft">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl">{isLogin ? 'Welcome Back' : 'Get Started'}</CardTitle>
              <CardDescription className="text-base">
                {isLogin 
                  ? 'Enter your credentials to access your account' 
                  : 'Create your account and start hiring or finding talent'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="h-11 input-focus"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 input-focus"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 input-focus"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Choose Your Role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'employer' })}
                        className={`p-5 rounded-xl border-2 transition-all group ${
                          formData.role === 'employer'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="text-3xl mb-2">💼</div>
                        <div className="font-semibold mb-1">Employer</div>
                        <div className="text-xs text-muted-foreground">Post jobs & hire talent</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'recruiter' })}
                        className={`p-5 rounded-xl border-2 transition-all group ${
                          formData.role === 'recruiter'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="text-3xl mb-2">🔍</div>
                        <div className="font-semibold mb-1">Recruiter</div>
                        <div className="text-xs text-muted-foreground">Find candidates</div>
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full btn-gradient h-12 text-base font-semibold shadow-lg" disabled={loading}>
                  {loading ? 'Please wait...' : isLogin ? 'Sign In →' : 'Create Account →'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                {isLogin ? (
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setIsLogin(false)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Sign up for free
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      onClick={() => setIsLogin(true)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>

              {/* Test credentials - Enhanced design */}
              <div className="mt-8 pt-6 border-t">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4">
                  <p className="text-xs font-semibold mb-3 flex items-center">
                    <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center mr-2">
                      🔑
                    </span>
                    Test Accounts
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-black/20">
                      <span className="font-medium">Employer:</span>
                      <code className="text-primary">employer@local.dev</code>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-black/20">
                      <span className="font-medium">Recruiter:</span>
                      <code className="text-primary">recruiter@local.dev</code>
                    </div>
                    <div className="text-center pt-2 text-muted-foreground">
                      Password: <code className="text-primary font-semibold">password</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our local-first, privacy-respecting platform
          </p>
        </div>
      </div>
    </div>
  )
}

