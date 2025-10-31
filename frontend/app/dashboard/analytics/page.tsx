"use client"

import { AnalyticsCard } from '@/components/analytics-card'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardAnalytics() {
  const { orders } = useOrderManager()
  return (
    <div>
      <AnalyticsCard orders={orders} />
    </div>
  )
}
