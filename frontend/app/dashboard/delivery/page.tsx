"use client"

import DeliveryManagement from '@/components/delivery-management'
import { SectionHeader } from '@/components/section-header'

export default function DashboardDelivery() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Delivery Orders"
        subtitle="Manage and track all delivery orders in real-time"
      />
      <DeliveryManagement />
    </div>
  )
}
