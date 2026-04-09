import { Award, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface BladesCardProps {
  balance: number
}

export function BladesCard({ balance }: BladesCardProps) {
  return (
    <Link
      href="/account/blades"
      className="group bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-6 transition-all hover:shadow-lg hover:border-amber-300"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
        <Award className="w-6 h-6 text-white" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900">Blades</h3>
      <p className="text-xs text-gray-400">Loyalty rewards</p>

      <div className="mt-2">
        <p className="text-2xl font-bold text-amber-700">{balance}</p>
        <p className="text-xs text-gray-400">points balance</p>
      </div>

      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors">
          View Rewards
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
