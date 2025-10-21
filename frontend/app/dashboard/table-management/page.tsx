"use client"

import { TableManagement } from '@/components/table-management'
import { useOrderManager } from '@/hooks/use-order-manager'

export default function DashboardTableManagement() {
  const { orders } = useOrderManager()
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Table Management</h2>
      <TableManagement orders={orders} />
    </div>
  )
}
