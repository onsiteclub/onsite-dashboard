import { getInitials, getFirstName } from '@/lib/utils'
import { HardHat } from 'lucide-react'

interface UserGreetingProps {
  fullName: string | null
  avatarUrl: string | null
}

export function UserGreeting({ fullName, avatarUrl }: UserGreetingProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName || 'User'}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-md">
            {getInitials(fullName)}
          </div>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Hey, {getFirstName(fullName)}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome to OnSite Club</p>
        </div>
      </div>

      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
        <HardHat className="w-5 h-5 text-white" />
      </div>
    </div>
  )
}
