'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Home,
  Clock,
  Calculator,
  ClipboardCheck,
  ShoppingBag,
  BookOpen,
  User,
  CreditCard,
  Settings,
  X,
} from 'lucide-react'

interface PaletteItem {
  id: string
  label: string
  section: string
  href: string
  icon: React.ElementType
}

const items: PaletteItem[] = [
  { id: 'home', label: 'Home', section: 'Navigation', href: '/account', icon: Home },
  { id: 'timekeeper', label: 'Timekeeper', section: 'Tech', href: '/account/timekeeper', icon: Clock },
  { id: 'calculator', label: 'Calculator', section: 'Tech', href: '/account/calculator', icon: Calculator },
  { id: 'checklist', label: 'Checklist', section: 'Tech', href: '/account/checklist', icon: ClipboardCheck },
  { id: 'orders', label: 'Orders', section: 'Shop', href: '/account/shop', icon: ShoppingBag },
  { id: 'certificates', label: 'Certificates', section: 'Learn', href: '/account/courses', icon: BookOpen },
  { id: 'profile', label: 'Profile', section: 'Account', href: '/account/profile', icon: User },
  { id: 'credit-card', label: 'Credit Card', section: 'Account', href: '/account/credit-card', icon: CreditCard },
  { id: 'settings', label: 'Settings', section: 'Account', href: '/account/settings', icon: Settings },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = query
    ? items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
      )
    : items

  // Group by section
  const sections = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  const flatFiltered = Object.values(sections).flat()

  const handleOpen = useCallback(() => {
    setOpen(true)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const handleSelect = useCallback((href: string) => {
    handleClose()
    router.push(href)
  }, [handleClose, router])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) handleClose()
        else handleOpen()
      }
      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, handleOpen, handleClose])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flatFiltered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatFiltered[activeIndex]) {
      handleSelect(flatFiltered[activeIndex].href)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {flatFiltered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No results found</p>
          ) : (
            Object.entries(sections).map(([section, sectionItems]) => (
              <div key={section}>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {section}
                </p>
                {sectionItems.map(item => {
                  const globalIdx = flatFiltered.indexOf(item)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        globalIdx === activeIndex ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${globalIdx === activeIndex ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">&uarr;&darr;</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Enter</kbd> Open</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
