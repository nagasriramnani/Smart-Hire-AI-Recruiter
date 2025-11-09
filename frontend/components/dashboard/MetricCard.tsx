'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    icon: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    icon: 'bg-green-500',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    icon: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    icon: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    icon: 'bg-red-500',
  },
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
}: MetricCardProps) {
  const colors = colorClasses[color]
  const isPositive = change && change > 0

  return (
    <Card className="relative overflow-hidden border-0 shadow-soft hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('p-2.5 rounded-xl', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-semibold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          <p className="text-sm text-muted-foreground">{label}</p>
          {changeLabel && (
            <p className="text-xs text-muted-foreground/80">{changeLabel}</p>
          )}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-1', colors.icon)} />
    </Card>
  )
}

