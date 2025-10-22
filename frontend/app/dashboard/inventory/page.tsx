"use client"

import { InventoryManagement } from '@/components/inventory-management'

export default function DashboardInventory() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Inventory</h2>
      <InventoryManagement />
    </div>
  )
}
