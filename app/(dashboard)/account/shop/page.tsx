import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ShoppingBag, Package, ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca'

export const metadata = {
  title: 'Orders | OnSite Club',
}

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: orders } = await supabase
    .from('app_shop_orders')
    .select('*')
    .eq('customer_email', user.email || '')
    .order('created_at', { ascending: false })

  const orderList = orders || []

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Your OnSite Shop order history</p>
        </div>
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          Go to Shop
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Orders List */}
      {orderList.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {orderList.map(order => (
            <div key={order.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order #{String(order.id).slice(0, 8)}</p>
                  <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                {order.total != null && (
                  <p className="font-semibold text-gray-900">{formatCurrency(order.total / 100)}</p>
                )}
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
          <p className="text-gray-400 mb-6">
            Visit the OnSite Shop for uniforms, PPE & equipment
          </p>
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            Browse Shop
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const badges: Record<string, { label: string; color: string }> = {
    fulfilled: { label: 'Fulfilled', color: 'bg-green-100 text-green-700' },
    paid: { label: 'Paid', color: 'bg-blue-100 text-blue-700' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-500' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
  }
  const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${badge.color}`}>
      {badge.label}
    </span>
  )
}
