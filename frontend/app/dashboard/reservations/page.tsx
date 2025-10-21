"use client"

import { ReservationManagement } from '@/components/reservation-management'

export default function DashboardReservations() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Reservations</h2>
      <ReservationManagement />
    </div>
  )
}
