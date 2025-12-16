"use client"

import { InventoryManagement } from '@/components/inventory-management'
import { SectionHeader } from '@/components/section-header'

export default function DashboardInventory() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Inventory"
        subtitle="Track and manage your restaurant inventory levels"
      />
      <InventoryManagement />
    </div>
  )
}
