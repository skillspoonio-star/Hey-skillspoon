"use client"

import { AnalyticsCard } from '@/components/analytics-card'
import { useOrderManager } from '@/hooks/use-order-manager'
import { InlineLoader } from '@/components/ui/loader'

export default function DashboardAnalytics() {
  const { orders, isLoading } = useOrderManager()
  
  if (isLoading) {
    return <InlineLoader text="Loading analytics..." size="md" />
  }
  
  return (
    <div>
      <AnalyticsCard orders={orders} />
    </div>
  )
}
