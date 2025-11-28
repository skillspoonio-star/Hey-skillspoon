"use client"

import { TableManagement } from '@/components/table-management'
import { useOrderManager } from '@/hooks/use-order-manager'
import { InlineLoader } from '@/components/ui/loader'

export default function DashboardTableManagement() {
  const { orders, isLoading } = useOrderManager()
  
  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Table Management</h2>
        <InlineLoader text="Loading tables..." size="md" />
      </div>
    )
  }
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Table Management</h2>
      <TableManagement orders={orders} />
    </div>
  )
}
