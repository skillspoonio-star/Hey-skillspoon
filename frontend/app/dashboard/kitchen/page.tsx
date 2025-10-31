"use client"

import { KitchenDisplay } from '@/components/kitchen-display'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardKitchen() {
  const { getOrdersByStatus, updateOrderStatus } = useOrderManager()
  const pending = getOrdersByStatus('pending')
  const preparing = getOrdersByStatus('preparing')
  return (
    <div>
      <KitchenDisplay orders={[...pending, ...preparing]} onStatusUpdate={updateOrderStatus} />
    </div>
  )
}
