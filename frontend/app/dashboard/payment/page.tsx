"use client"

import { PaymentConfirmation } from '@/components/payment-confirmation'

export default function DashboardPayment() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Payment Confirmation</h2>
      <PaymentConfirmation />
    </div>
  )
}
