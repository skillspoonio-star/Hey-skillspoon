"use client"

import { KitchenDisplay } from '@/components/kitchen-display'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardKitchen() {
  const { getOrdersByStatus, updateOrderStatus } = useOrderManager()
  const pending = getOrdersByStatus('pending')
  const preparing = getOrdersByStatus('preparing')
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Kitchen Display</h2>
      <KitchenDisplay orders={[...pending, ...preparing]} onStatusUpdate={updateOrderStatus} />
    </div>
  )
}
