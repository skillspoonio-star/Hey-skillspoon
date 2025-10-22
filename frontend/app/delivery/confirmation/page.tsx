"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { fetchMenuItems, type MenuItem } from '@/lib/menu-data'

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
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto p-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-700">Order Placed!</h2>
                <p className="text-green-700">Your delivery order has been placed successfully.</p>
                <div className="text-sm text-green-800 mt-2">Order #{orderDetails?._id ?? orderDetails?.id ?? '—'}</div>
                <div className="text-sm text-green-800">Amount: ₹{orderDetails?.total ?? 0}</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium">Items</h3>
              <div className="space-y-2 mt-2">
                {(mappedItems.length ? mappedItems : (orderDetails?.items || [])).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>{it.name} <span className="text-muted-foreground">x{it.quantity}</span></div>
                    <div>₹{(Number(it.price) * Number(it.quantity)).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-sm">
              <div>Estimated arrival within 30-45 minutes.</div>
              <div className="mt-2 flex gap-2">
                <Button onClick={() => router.push('/delivery/menu')}>Order More</Button>
                <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
