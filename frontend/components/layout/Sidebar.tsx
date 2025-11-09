'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Search,
  BookmarkIcon,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

const employerNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/employer/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Jobs',
    href: '/employer/jobs',
    icon: Briefcase,
  },
  {
    title: 'Applications',
    href: '/employer/applications',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/employer/analytics',
    icon: BarChart3,
  },
]

const recruiterNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/recruiter/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Search',
    href: '/recruiter/search',
    icon: Search,
  },
  {
    title: 'Candidates',
    href: '/recruiter/candidates',
    icon: Users,
  },
  {
    title: 'Bookmarks',
    href: '/recruiter/bookmarks',
    icon: BookmarkIcon,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const navItems = user?.role === 'employer' ? employerNav : recruiterNav

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-card">
      <div className="flex h-full flex-col gap-2 p-4">
        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-secondary'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* Settings */}
        <Link href="/settings">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 font-medium',
              pathname === '/settings' ? 'bg-secondary' : ''
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </Link>

        {/* Upgrade Card */}
        <div className="rounded-xl bg-gradient-to-br from-primary to-purple-600 p-4 text-white">
          <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
          <p className="text-xs text-white/80 mb-3">
            Unlock advanced AI features
          </p>
          <Button size="sm" className="w-full bg-white text-primary hover:bg-white/90">
            Learn More
          </Button>
        </div>
      </div>
    </aside>
  )
}

