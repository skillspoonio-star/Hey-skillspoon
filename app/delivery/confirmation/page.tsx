"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function DeliveryConfirmationPage() {
  const router = useRouter()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTotal(Number(localStorage.getItem("delivery:latestTotal") || 0))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto p-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Order Placed!</h2>
            <p className="text-green-700 mb-4">Your delivery order has been placed successfully.</p>
            <div className="text-sm text-green-800">Amount: ₹{total}</div>
            <p className="text-sm text-green-800 mt-2">Estimated arrival within 30-45 minutes.</p>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" onClick={() => router.push("/delivery/menu")}>
                Order More
              </Button>
              <Button className="flex-1 bg-transparent" variant="outline" onClick={() => router.push("/")}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
