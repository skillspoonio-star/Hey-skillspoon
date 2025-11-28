"use client"

import { KitchenDisplay } from '@/components/kitchen-display'
import { useOrderManager } from '@/hooks/use-order-manager'
import { InlineLoader } from '@/components/ui/loader'
import { SectionHeader } from '@/components/section-header'

export default function DashboardKitchen() {
  const { isLoading, getOrdersByStatus, updateOrderStatus } = useOrderManager()
  const pending = getOrdersByStatus('pending')
  const preparing = getOrdersByStatus('preparing')
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoader text="Loading kitchen orders..." size="md" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Kitchen Display System"
        subtitle="Real-time order management for kitchen staff"
      />
      <KitchenDisplay orders={[...pending, ...preparing]} onStatusUpdate={updateOrderStatus} />
    </div>
  )
}
