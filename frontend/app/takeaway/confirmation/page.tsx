"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, MapPin, Phone, Download, Share } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchMenuItems, type MenuItem } from '@/lib/menu-data'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function TakeawayConfirmationPage() {
  const router = useRouter()
  const [orderStatus, setOrderStatus] = useState("pending")
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const orderIdFromQuery = searchParams?.get('orderId')

  const [orderDetails, setOrderDetails] = useState<any | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [mappedItems, setMappedItems] = useState<any[]>([])

  // load menu items for resolving itemId -> name/price
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const items = await fetchMenuItems()
        if (!mounted) return
        setMenuItems(items)
      } catch (err) {
        console.error('Failed to load menu items for confirmation page', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!orderIdFromQuery) return
    let mounted = true
      ; (async () => {
        try {
          const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
          const res = await fetch(`${base}/api/orders/${orderIdFromQuery}`)
          if (!res.ok) {
            console.error('Failed to fetch order details', res.status)
            return
          }
          const o = await res.json()
          if (!mounted) return
          setOrderDetails(o)
        } catch (err) {
          console.error('Error fetching order details', err)
        }
      })()
    return () => {
      mounted = false
    }
  }, [orderIdFromQuery])

  useEffect(() => {
    // Drive displayed status and estimated time from fetched order
    if (!orderDetails) return
    setOrderStatus(orderDetails.status || 'pending')
    setEstimatedTime(typeof orderDetails.estimatedTime !== 'undefined' ? orderDetails.estimatedTime : null)
  }, [orderDetails])

  // map order items to menu items when both are available
  useEffect(() => {
    if (!orderDetails) return
    const items = (orderDetails.items || []).map((it: any) => {
      const itemId = Number(it.itemId ?? it.id ?? it.item)
      const menu = menuItems.find((m) => Number(m.id) === itemId)
      return {
        itemId,
        name: menu?.name || it.name || `Item ${itemId}`,
        price: Number(menu?.price ?? it.price ?? 0),
        description: menu?.description ?? it.description ?? '',
        image: menu?.image ?? it.image ?? '',
        quantity: Number(it.quantity ?? 1),
      }
    })
    setMappedItems(items)
  }, [orderDetails, menuItems])

  const getStatusInfo = () => {
    switch (orderStatus) {
      case "confirmed":
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          title: "Order Confirmed!",
          description: "Your order has been received and is being prepared",
          color: "bg-green-50 border-green-200",
        }
      case "preparing":
        return {
          icon: <Clock className="w-6 h-6 text-orange-600" />,
          title: "Preparing Your Order",
          description: "Our chefs are working on your delicious meal",
          color: "bg-orange-50 border-orange-200",
        }
      case "ready":
        return {
          icon: <CheckCircle className="w-6 h-6 text-primary" />,
          title: "Order Ready for Pickup!",
          description: "Your order is ready. Please come to collect it",
          color: "bg-primary/10 border-primary/20",
        }
      default:
        return {
          icon: <Clock className="w-6 h-6 text-gray-600" />,
          title: "Processing...",
          description: "Please wait",
          color: "bg-gray-50 border-gray-200",
        }
    }
  }

  const statusInfo = getStatusInfo()

  // share modal state
  const [shareOpen, setShareOpen] = useState(false)
  const shareLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/takeaway/confirmation?orderId=${orderIdFromQuery ?? ''}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      // small visual feedback could be added
      alert('Link copied to clipboard')
    } catch (err) {
      console.error('Copy failed', err)
      alert('Failed to copy link')
    }
  }

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Hi, here's my order: ${shareLink}`)
    const url = `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  const tryNativeShare = async () => {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'My Order', text: 'Here is my order', url: shareLink })
      } catch (err) {
        console.error('Native share failed', err)
      }
    } else {
      // fallback to WhatsApp if available
      shareToWhatsApp()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg text-foreground">Order Confirmation</h1>
              <p className="text-xs text-muted-foreground">Order #{orderDetails?._id ?? orderDetails?.id ?? '—'}</p>
            </div>
          </div>
          <Badge variant="default">Takeaway</Badge>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Status */}
        <Card className={`${statusInfo.color}`}>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">{statusInfo.icon}</div>
            <h2 className="text-xl font-bold mb-2">{statusInfo.title}</h2>
            <p className="text-muted-foreground mb-4">{statusInfo.description}</p>

            {estimatedTime !== null && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Estimated time: {estimatedTime} minutes</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderDetails ? (
              <>
                <div className="space-y-3">
                  {(mappedItems.length ? mappedItems : (orderDetails.items || [])).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{it.name || it.itemId || `Item ${idx + 1}`}</p>
                        <p className="text-sm text-muted-foreground">Qty: {it.quantity || 1}</p>
                      </div>
                      <p className="font-medium">₹{Number((it.price ?? 0) * (it.quantity || 1)).toFixed(0)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{orderDetails?.subtotal ?? orderDetails?.subTotal ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax + Packing Charges</span>
                    <span>₹{orderDetails?.tax ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>₹{orderDetails?.discount ?? 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Paid</span>
                    <span>₹{orderDetails?.total ?? 0}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Payment Method: {orderDetails?.paymentMethod}</p>
                  <p>
                    Payment Status: <span className="text-green-600 font-medium">{orderDetails?.paymentStatus ?? orderDetails.paymentStatus ?? 'Completed'}</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-muted-foreground">Loading order details...</div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium">Name:</span> {orderDetails?.customerName}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {orderDetails?.customerPhone}
            </p>
          </CardContent>
        </Card>

        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">Spice Garden Restaurant</p>
              <p className="text-sm text-muted-foreground">123 Food Street, Sector 18, Noida</p>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">+91 9876543210</span>
            </div>

            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Get Directions
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={() => {
              // generate a print-friendly HTML receipt and trigger print (user can Save as PDF)
              const order = orderDetails ?? {}
              const items = (mappedItems.length ? mappedItems : (order.items || [])).map((it: any) => ({
                name: it.name || `Item ${it.itemId ?? it.id}`,
                qty: it.quantity || 1,
                price: Number(it.price ?? 0),
                line: Number((it.price ?? 0) * (it.quantity || 1)),
              }))

              const rows = items.map((i: { name: string; qty: number; price: number; line: number }) => `
                <tr>
                  <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
                  <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
                  <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${i.line.toFixed(2)}</td>
                </tr>
              `).join('')

              const subtotal = Number(order.subtotal ?? order.subTotal ?? items.reduce((s: number, it: { line: number }) => s + it.line, 0))
              const tax = Number(order.tax ?? 0)
              const discount = Number(order.discount ?? 0)
              const total = Number(order.total ?? subtotal + tax - discount)

              const html = `
                <html>
                <head>
                  <title>Order Receipt</title>
                  <style>
                    body{font-family:Arial,Helvetica,sans-serif;color:#111}
                    .header{display:flex;justify-content:space-between;align-items:center}
                    .title{font-size:20px;font-weight:700}
                    table{width:100%;border-collapse:collapse;margin-top:12px}
                    .muted{color:#666;font-size:12px}
                    .totals td{padding:6px}
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div>
                      <div class="title">Spice Garden Restaurant</div>
                      <div class="muted">11:00 AM - 11:00 PM</div>
                      <div class="muted">123 Food Street, Sector 18, Noida</div>
                    </div>
                    <div style="text-align:right">
                      <div>Order: ${order._id ?? order.id ?? ''}</div>
                      <div class="muted">${new Date(order.createdAt ?? Date.now()).toLocaleString()}</div>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Item</th>
                        <th style="text-align:center;padding:8px;border-bottom:2px solid #ddd">Qty</th>
                        <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rows}
                    </tbody>
                  </table>

                  <table style="width:100%;margin-top:12px">
                    <tr class="totals">
                      <td style="text-align:left">Subtotal</td>
                      <td style="text-align:right">₹${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr class="totals">
                      <td style="text-align:left">Tax</td>
                      <td style="text-align:right">₹${tax.toFixed(2)}</td>
                    </tr>
                    <tr class="totals">
                      <td style="text-align:left">Discount</td>
                      <td style="text-align:right">-₹${discount.toFixed(2)}</td>
                    </tr>
                    <tr class="totals" style="font-weight:700;font-size:16px">
                      <td style="text-align:left">Total</td>
                      <td style="text-align:right">₹${total.toFixed(2)}</td>
                    </tr>
                  </table>

                  <div style="margin-top:20px;color:#666;font-size:12px">Payment Method: ${order.paymentMethod ?? 'N/A'}</div>
                </body>
                </html>
              `

              const w = window.open('', '_blank')
              if (!w) {
                alert('Unable to open print window — please allow popups')
                return
              }
              w.document.open()
              w.document.write(html)
              w.document.close()
              // wait a little for images/styles to load then print
              setTimeout(() => {
                w.focus()
                w.print()
                // optionally close the window after print
                // w.close()
              }, 300)
            }}>
              <Download className="w-4 h-4" />
              Download
            </Button>

            <Dialog open={shareOpen} onOpenChange={(v) => setShareOpen(v)}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Share className="w-4 h-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share your order</DialogTitle>
                  <DialogDescription>Send the order confirmation link to someone via WhatsApp or any other app.</DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <input readOnly value={shareLink} className="w-full rounded-md border px-3 py-2 bg-muted text-sm" />
                  <div className="flex gap-2 mt-3">
                    <Button onClick={copyLink} className="flex-1">Copy link</Button>
                    <Button onClick={shareToWhatsApp} variant="secondary" className="flex-1">WhatsApp</Button>
                    <Button onClick={tryNativeShare} variant="ghost" className="flex-1">More...</Button>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Button className="w-full" onClick={() => router.push("/takeaway")}>
            Order Again
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-800 mb-2">Pickup Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Show this confirmation screen at the counter</li>
              <li>• Mention your order ID: {orderDetails?._id ?? orderDetails?.id ?? '—'}</li>
              <li>• Please arrive within 15 minutes of ready time</li>
              <li>• Call the restaurant if you need any assistance</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
