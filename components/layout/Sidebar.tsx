'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Home,
  Clock,
  Calculator,
  ClipboardCheck,
  ShoppingBag,
  BookOpen,
  User,
  CreditCard,
  Settings,
  LogOut,
  HardHat,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LucideIcon,
} from 'lucide-react'

interface SidebarProps {
  subscriptions?: { app_name: string; status: string }[]
  shopOrderCount?: number
  learnCredentialCount?: number
}

interface SidebarSection {
  label: string
  items: SidebarItem[]
}

interface SidebarItem {
  name: string
  href: string
  icon: LucideIcon
  external?: boolean
  badge?: string
  badgeColor?: string
  comingSoon?: boolean
}

const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca'
const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || 'https://learn.onsiteclub.ca'

export function Sidebar({ subscriptions = [], shopOrderCount = 0, learnCredentialCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function getSubStatus(appName: string): string | null {
    const sub = subscriptions.find(s => s.app_name === appName)
    if (!sub) return null
    return sub.status
  }

  function getStatusBadge(status: string | null): { text: string; color: string } | null {
    if (!status || status === 'none') return null
    const map: Record<string, { text: string; color: string }> = {
      active: { text: 'Active', color: 'bg-green-100 text-green-700' },
      trialing: { text: 'Trial', color: 'bg-blue-100 text-blue-700' },
      canceled: { text: 'Canceled', color: 'bg-gray-100 text-gray-500' },
      past_due: { text: 'Past Due', color: 'bg-red-100 text-red-700' },
    }
    return map[status] || null
  }

  const tkBadge = getStatusBadge(getSubStatus('timekeeper'))
  const calcBadge = getStatusBadge(getSubStatus('calculator'))

  const sections: SidebarSection[] = [
    {
      label: 'Tech',
      items: [
        {
          name: 'Timekeeper',
          href: '/account/timekeeper',
          icon: Clock,
          badge: tkBadge?.text,
          badgeColor: tkBadge?.color,
        },
        {
          name: 'Calculator',
          href: '/account/calculator',
          icon: Calculator,
          badge: calcBadge?.text,
          badgeColor: calcBadge?.color,
        },
        {
          name: 'Checklist',
          href: '/account/checklist',
          icon: ClipboardCheck,
          comingSoon: true,
        },
      ],
    },
    {
      label: 'Shop',
      items: [
        {
          name: 'Orders',
          href: '/account/shop',
          icon: ShoppingBag,
          badge: shopOrderCount > 0 ? String(shopOrderCount) : undefined,
          badgeColor: 'bg-green-100 text-green-700',
        },
      ],
    },
    {
      label: 'Learn',
      items: [
        {
          name: 'Certificates',
          href: '/account/courses',
          icon: BookOpen,
          badge: learnCredentialCount > 0 ? String(learnCredentialCount) : undefined,
          badgeColor: 'bg-orange-100 text-orange-700',
        },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Profile', href: '/account/profile', icon: User },
        { name: 'Credit Card', href: '/account/credit-card', icon: CreditCard, comingSoon: true },
        { name: 'Settings', href: '/account/settings', icon: Settings },
      ],
    },
  ]

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-200`}
    >
      {/* Logo + Collapse Toggle */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <Link href="/account" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">OnSite Club</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Home */}
      <div className="px-3 pt-3">
        <NavItem
          item={{ name: 'Home', href: '/account', icon: Home }}
          active={pathname === '/account'}
          collapsed={collapsed}
        />
      </div>

      {/* Sections */}
      <nav className="flex-1 px-3 pt-2 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-gray-100" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: SidebarItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  if (item.comingSoon) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl text-gray-400 cursor-default ${
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
        }`}
        title={`${item.name} (Coming Soon)`}
      >
        <Icon className="w-5 h-5 flex-shrink-0 opacity-40" />
        {!collapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{item.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 flex-shrink-0">
              Soon
            </span>
          </div>
        )}
      </div>
    )
  }

  const Component = item.external ? 'a' : Link
  const linkProps = item.external
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  return (
    <Component
      href={item.href}
      {...linkProps}
      className={`flex items-center gap-3 rounded-xl transition-all ${
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
      } ${
        active
          ? 'bg-amber-50 text-amber-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      title={collapsed ? item.name : undefined}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${active ? 'text-amber-600' : 'text-gray-400'}`}
      />
      {!collapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{item.name}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {item.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.badgeColor || 'bg-gray-100 text-gray-600'}`}>
                {item.badge}
              </span>
            )}
            {item.external && (
              <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
            )}
          </div>
        </div>
      )}
    </Component>
  )
}
