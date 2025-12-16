"use client"

import { StaffManagement } from '@/components/staff-management'
import { SectionHeader } from '@/components/section-header'

export default function DashboardStaff() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Staff Management"
        subtitle="Monitor and manage your restaurant staff performance"
      />
      <StaffManagement />
    </div>
  )
}
