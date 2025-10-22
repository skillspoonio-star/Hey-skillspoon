"use client"

import { SectionHeader } from '@/components/section-header'
import { OrderCard } from '@/components/order-card'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardHome() {
  const { orders, updateOrderStatus, getOrdersByStatus, getAnalytics } = useOrderManager()
  const pending = getOrdersByStatus('pending')
  const preparing = getOrdersByStatus('preparing')
  const ready = getOrdersByStatus('ready')
  const analytics = getAnalytics()

  return (
    <div className="space-y-6">
      <SectionHeader title="Live Orders" subtitle="Monitor and manage real-time orders" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold">Pending ({pending.length})</h3>
          <div className="space-y-4">{pending.map((o) => <OrderCard key={String(o.id)} order={o} onStatusUpdate={updateOrderStatus} />)}</div>
        </div>
        <div>
          <h3 className="font-semibold">Preparing ({preparing.length})</h3>
          <div className="space-y-4">{preparing.map((o) => <OrderCard key={String(o.id)} order={o} onStatusUpdate={updateOrderStatus} />)}</div>
        </div>
        <div>
          <h3 className="font-semibold">Ready ({ready.length})</h3>
          <div className="space-y-4">{ready.map((o) => <OrderCard key={String(o.id)} order={o} onStatusUpdate={updateOrderStatus} />)}</div>
        </div>
      </div>
    </div>
  )
}
