"use client"

import { MenuManagement } from '@/components/menu-management'

export default function DashboardMenu() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Menu Management</h2>
      <MenuManagement />
    </div>
  )
}
