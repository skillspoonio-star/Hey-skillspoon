"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { fetchMenuItems, type MenuItem } from '@/lib/menu-data'
import { BackButton } from "@/components/ui/back-button"

export default function DeliveryConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderIdFromQuery = searchParams?.get('orderId')

  const [orderDetails, setOrderDetails] = useState<any | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [mappedItems, setMappedItems] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const items = await fetchMenuItems()
        if (!mounted) return
        setMenuItems(items)
      } catch (err) {
        console.error('Failed to load menu items', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!orderIdFromQuery) return
    let mounted = true
    ;(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/orders/${orderIdFromQuery}`)
        if (!res.ok) {
          console.error('Failed to fetch delivery order', res.status)
          return
        }
        const o = await res.json()
        if (!mounted) return
        setOrderDetails(o)
      } catch (err) {
        console.error('Error fetching order details', err)
      }
    })()
    return () => { mounted = false }
  }, [orderIdFromQuery])

  useEffect(() => {
    if (!orderDetails) return
    const items = (orderDetails.items || []).map((it: any) => {
      const itemId = Number(it.itemId ?? it.id ?? it.item)
      const menu = menuItems.find((m) => Number(m.id) === itemId)
      return {
        itemId,
        name: menu?.name || it.name || `Item ${itemId}`,
        price: Number(menu?.price ?? it.price ?? 0),
        quantity: Number(it.quantity ?? 1),
      }
    })
    setMappedItems(items)
  }, [orderDetails, menuItems])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <BackButton className="absolute top-4 left-4" fallbackRoute="/" />
      <Card className="w-full max-w-md border-2 border-green-500 shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-green-700">Order Placed!</h2>
              <p className="text-green-700">Your delivery order has been placed successfully.</p>
            </div>

            <div className="w-full bg-green-50 rounded-lg p-4 space-y-1">
              <div className="text-sm font-medium text-green-800">Order #{orderDetails?._id ?? orderDetails?.id ?? '—'}</div>
              <div className="text-lg font-bold text-green-900">Amount: ₹{orderDetails?.total ?? 0}</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-lg">Order Items</h3>
            <div className="space-y-2 bg-muted/50 rounded-lg p-4">
              {(mappedItems.length ? mappedItems : (orderDetails?.items || [])).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-medium">{it.name}</span>
                    <span className="text-muted-foreground ml-2">x{it.quantity}</span>
                  </div>
                  <div className="font-semibold">₹{(Number(it.price) * Number(it.quantity)).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium">
              🚚 Estimated arrival within 30-45 minutes
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.push('/delivery/menu')} 
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
            >
              Order More
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
