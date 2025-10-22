"use client"

import { CounterOrderManagement } from '@/components/counter-order-management'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardCounter() {
  const { orders } = useOrderManager()
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Counter Orders</h2>
      <CounterOrderManagement />
    </div>
  )
}
