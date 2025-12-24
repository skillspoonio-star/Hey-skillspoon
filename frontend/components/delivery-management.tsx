"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, MapPin, Phone, Clock, CheckCircle, Search, XCircle } from "lucide-react"
import { fetchMenuItems, MenuItem } from "@/lib/menu-data"
import { InlineLoader } from "@/components/ui/loader"
import { useToast } from "@/components/providers/toast-provider"

type DeliveryOrder = {
  id: string
  deliveryNo?: number
  customerName: string
  phone: string
  address: string
  items: Array<{ itemId?: number; name: string; quantity: number; price?: number }>
  total: number
  status: string
  orderStatus?: string | null
  placedAt: string
  eta?: string
  notes?: string
  paymentStatus: string
  paymentMethod: string
  tableNumber?: number | null
}

// Helper function to format order ID to friendly format
const formatOrderId = (deliveryNo?: number): string => {
  if (!deliveryNo) return 'N/A'
  return `DLV${deliveryNo}`
}

export default function DeliveryManagement() {
  const { success, error, warning } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
          const res = await fetch(`${base}/api/deliveries`)
          if (!res.ok) return
          const data = await res.json()
          if (!mounted) return

          // fetch menu to enrich item names/prices
          let menu: MenuItem[] = []
          try {
            menu = await fetchMenuItems()
          } catch (mErr) {
            console.warn('Failed to load menu items for enrichment', mErr)
          }
          const menuById = new Map(menu.map((m) => [m.id, m]))

          // Sort by creation date (oldest first) to assign sequential numbers
          const sortedData = [...data].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )

          const mapped = sortedData.map((d: any, index: number) => {
            // prefer fields from populated orderId when available
            const order = d.orderId || null
            const sourceItems = order?.items ?? d.items ?? []
            const mappedItems = sourceItems.map((it: any) => {
              const menuItem = menuById.get(Number(it.itemId))
              return {
                itemId: Number(it.itemId),
                name: menuItem ? menuItem.name : (it.name || `Item ${it.itemId}`),
                quantity: it.quantity,
                price: menuItem ? menuItem.price : (it.price ?? undefined),
              }
            })

            return {
              id: d._id,
              deliveryNo: index + 1, // Sequential number starting from 1
              customerName: order ? (order.customerName || '') : (d.customerName || ''),
              phone: order ? (order.customerPhone || order.customerPhone) : (d.customerPhone || ''),
              address: d.address?.fullAddress || '',
              items: mappedItems,
              total: order ? (order.total ?? d.total) : (d.total ?? 0),
              status: d.status,
              orderStatus: order ? (order.status || null) : null,
              placedAt: new Date(d.createdAt).toLocaleString(),
              eta: d.eta ? `${d.eta} mins` : undefined,
              paymentStatus: order ? (order.paymentStatus || 'unpaid') : (d.paymentStatus || 'unpaid'),
              paymentMethod: order ? (order.paymentMethod || 'pending') : (d.paymentMethod || 'pending'),
              tableNumber: order ? order.tableNumber : (d.tableNumber ?? null),
            }
          })

          // Reverse to show newest first in the UI
          setOrders(mapped.reverse())
        } catch (err) {
          console.error('Failed to load deliveries', err)
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [])

  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      preparing: "bg-blue-100 text-blue-800",
      "out-for-delivery": "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return map[s] ?? 'bg-gray-100 text-gray-800'
  }

  const filtered = useMemo(() =>
    orders.filter((o) => {
      const matches =
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone.includes(searchTerm) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.address.toLowerCase().includes(searchTerm.toLowerCase())
      const statusOk = statusFilter === "all" || o.status === statusFilter
      return matches && statusOk
    }), [orders, searchTerm, statusFilter]
  )

  const markNext = async (id: string) => {
    const nextStatusFor = (s: string) => {
      const flow = ["pending", "out-for-delivery", "delivered"]
      const idx = flow.indexOf(s)
      return flow[Math.min(flow.length - 1, Math.max(0, idx + 1))]
    }

    // find order and check linked orderStatus
    const o = orders.find((x) => x.id === id)
    if (!o) return
    // Only allow transition if linked order is in 'ready'
    if (o.orderStatus !== 'served') {
      // Show a user-friendly popup
      warning('Cannot update delivery status: order is not ready yet.', 'Order Not Ready')
      return
    }

    // Attempt update on server first
    try {
      setUpdatingOrderId(id)
      const next = nextStatusFor(o.status)
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const res = await fetch(`${base}/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })

      if (res.status === 409) {
        const body = await res.json().catch(() => ({}))
        warning(body.error || 'Cannot update delivery status: order is not ready yet.', 'Status Update Failed')
        return
      }

      if (!res.ok) {
        throw new Error('failed')
      }

      const updated = await res.json()
      setOrders((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)))
    } catch (err) {
      console.error('Failed to update delivery status', err)
      error('Failed to update delivery status. Please try again.', 'Update Failed')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handlePrint = (order: DeliveryOrder) => {
    // Build a simple printable HTML string with order details
    const html = `
      <html>
      <head>
        <title>Delivery ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px }
          h1 { font-size: 20px }
          table { width: 100%; border-collapse: collapse; margin-top: 10px }
          th, td { padding: 8px; border: 1px solid #ddd; text-align: left }
          .right { text-align: right }
        </style>
      </head>
      <body>
        <h1>Delivery Receipt - #${order.id}</h1>
        <p><strong>Customer:</strong> ${order.customerName} • ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        ${order.tableNumber ? `<p><strong>Delivery No:</strong> ${order.tableNumber}</p>` : ''}
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th class="right">Price</th></tr></thead>
          <tbody>
            ${order.items.map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td class="right">₹${(i.price ?? 0) * i.quantity}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="text-align:right; font-weight:bold; margin-top:10px">Total: ₹${order.total}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
        <p><em>Notes: ${order.notes ?? ''}</em></p>
      </body>
      </html>
    `

    const newWin = window.open('', '_blank')
    if (!newWin) return
    newWin.document.open()
    newWin.document.write(html)
    newWin.document.close()
    // Delay print to allow the document to render
    setTimeout(() => {
      newWin.focus()
      newWin.print()
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoader size="md" text="Loading delivery orders..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-3xl font-bold">
                  {filtered.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length}
                </p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                  {filtered.filter((o) => o.status === "delivered").length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                  {filtered.filter((o) => o.paymentStatus === "pending").length}
                </p>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{filtered.length}</p>
                <p className="text-xs text-muted-foreground">All orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10 h-11"
                placeholder="Search by ID, name, phone, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56 h-11">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-muted rounded-full">
                <XCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">No delivery orders found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Delivery orders will appear here once placed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">#{formatOrderId(order.deliveryNo)}</CardTitle>
                  <Badge className={getStatusBadge(order.status)}>{order.status.replaceAll("-", " ")}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Placed: {order.placedAt} {order.eta ? `• ETA: ${order.eta}` : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{order.customerName}</span> • {order.phone}
                </div>
                {order.tableNumber ? (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Delivery No:</span>{" "}
                    <span className="font-medium">{order.tableNumber}</span>
                  </div>
                ) : null}
                <div className="text-sm flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="break-words">{order.address}</span>
                </div>
                <div className="text-sm space-y-1 pt-2 border-t">
                  <p className="font-medium text-muted-foreground">Items:</p>
                  <div className="space-y-0.5">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{i.quantity}x {i.name}</span>
                        {i.price && <span className="text-muted-foreground">₹{i.price * i.quantity}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Payment:</span>{" "}
                    <Badge variant={order.paymentStatus === "completed" ? "secondary" : "outline"}>
                      {order.paymentMethod}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">₹{order.total}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => markNext(order.id)}
                    disabled={updatingOrderId === order.id}
                    className="flex-1"
                  >
                    {updatingOrderId === order.id ? (
                      <InlineLoader size="sm" text="Updating..." />
                    ) : (
                      "Advance Status"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(order)}
                    className="flex-1"
                  >
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
