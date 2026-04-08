'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { Search, ChevronRight, LogOut, User, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  userName: string | null
  userEmail: string
  avatarUrl: string | null
}

const breadcrumbLabels: Record<string, string> = {
  account: 'Dashboard',
  timekeeper: 'Timekeeper',
  calculator: 'Calculator',
  checklist: 'Checklist',
  shop: 'Orders',
  courses: 'Certificates',
  profile: 'Profile',
  settings: 'Settings',
  blades: 'Blades',
  'credit-card': 'Credit Card',
}

const sectionLabels: Record<string, string> = {
  timekeeper: 'Tech',
  calculator: 'Tech',
  checklist: 'Tech',
  shop: 'Shop',
  courses: 'Learn',
  profile: 'Account',
  settings: 'Account',
  'credit-card': 'Account',
  blades: 'Account',
}

export function Header({ userName, userEmail, avatarUrl }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Build breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  if (segments.length > 1) {
    breadcrumbs.push({ label: 'Dashboard', href: '/account' })

    const lastSegment = segments[segments.length - 1]
    const section = sectionLabels[lastSegment]
    if (section) {
      breadcrumbs.push({ label: section, href: '/account' })
    }

    const pageLabel = breadcrumbLabels[lastSegment]
    if (pageLabel && pageLabel !== 'Dashboard') {
      breadcrumbs.push({ label: pageLabel, href: pathname })
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.length === 0 ? (
          <span className="font-medium text-gray-900">Dashboard</span>
        ) : (
          breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))
        )}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search hint */}
        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-500 transition-colors"
          onClick={() => {
            // Command palette will be wired in Phase 3
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
            document.dispatchEvent(event)
          }}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-400 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-xs">
                {getInitials(userName)}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{userName || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
              <Link
                href="/account/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/account/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
