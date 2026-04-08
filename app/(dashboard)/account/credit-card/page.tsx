import { CreditCard } from 'lucide-react'

export const metadata = {
  title: 'Credit Card | OnSite Club',
}

export default function CreditCardPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Credit Card Management</h1>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Manage your payment methods, view billing history, and update your credit card details — all in one place.
        </p>
        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-500">
          Coming Soon
        </span>
      </div>
    </div>
  )
}
