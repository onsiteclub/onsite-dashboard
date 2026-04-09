import { LucideIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface LandingCardProps {
  icon: LucideIcon
  title: string
  stat?: string
  statLabel?: string
  description?: string
  ctaLabel: string
  href: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'gray' | 'amber'
  disabled?: boolean
  badge?: string
  badgeColor?: string
  isMetaCard?: boolean
}

const iconBg: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  teal: 'bg-teal-50 text-teal-600',
  gray: 'bg-gray-100 text-gray-600',
  amber: 'bg-amber-50 text-amber-600',
}

const ctaBg: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  orange: 'bg-orange-600 hover:bg-orange-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  teal: 'bg-teal-600 hover:bg-teal-700 text-white',
  gray: 'bg-gray-600 hover:bg-gray-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
}

const hoverBorder: Record<string, string> = {
  blue: 'hover:border-blue-200',
  green: 'hover:border-green-200',
  orange: 'hover:border-orange-200',
  purple: 'hover:border-purple-200',
  teal: 'hover:border-teal-200',
  gray: 'hover:border-gray-300',
  amber: 'hover:border-amber-200',
}

export function LandingCard({
  icon: Icon,
  title,
  stat,
  statLabel,
  description,
  ctaLabel,
  href,
  color,
  disabled,
  badge,
  badgeColor,
  isMetaCard,
}: LandingCardProps) {
  if (disabled) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 opacity-60">
        <div className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-500">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-500">
            Coming Soon
          </span>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`group bg-white rounded-2xl border border-gray-200 p-6 transition-all hover:shadow-lg ${hoverBorder[color] || ''} ${isMetaCard ? 'text-center' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg[color] || 'bg-gray-50 text-gray-600'} ${isMetaCard ? 'mx-auto' : ''}`}>
        <Icon className="w-6 h-6" />
      </div>

      <div className="mt-4">
        <div className={`flex items-center gap-2 ${isMetaCard ? 'justify-center' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor || 'bg-gray-100 text-gray-600'}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {stat && (
        <div className="mt-2">
          <p className="text-2xl font-bold text-gray-900">{stat}</p>
          {statLabel && <p className="text-xs text-gray-400">{statLabel}</p>}
        </div>
      )}

      {description && (
        <p className={`mt-2 text-sm text-gray-500 ${isMetaCard ? '' : ''}`}>{description}</p>
      )}

      <div className={`mt-4 ${isMetaCard ? '' : ''}`}>
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ctaBg[color] || ''}`}>
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
