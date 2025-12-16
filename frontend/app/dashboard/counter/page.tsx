"use client"

import { CounterOrderManagement } from '@/components/counter-order-management'

export default function DashboardCounter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Counter Orders</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage walk-in customer orders and table assignments</p>
      </div>
      <CounterOrderManagement />
    </div>
  )
}
