"use client"

import { AnalyticsCard } from '@/components/analytics-card'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardAnalytics() {
  const { orders } = useOrderManager()
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      <AnalyticsCard orders={orders} />
    </div>
  )
}
