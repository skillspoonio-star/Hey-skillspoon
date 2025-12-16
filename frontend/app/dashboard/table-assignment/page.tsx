"use client"

import { TableAssignmentPage } from '@/components/table-assignment-page'
import { SectionHeader } from '@/components/section-header'

export default function DashboardTableAssignment() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Table Assignment"
        subtitle="Assign customers to tables and manage dining sessions"
      />
      <TableAssignmentPage />
    </div>
  )
}
