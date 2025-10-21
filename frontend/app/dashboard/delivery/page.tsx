"use client"

import DeliveryManagement from '@/components/delivery-management'

export default function DashboardDelivery() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Delivery Orders</h2>
      <DeliveryManagement />
    </div>
  )
}
