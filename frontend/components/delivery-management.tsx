"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, MapPin, Phone, Clock, CheckCircle, Search } from "lucide-react"
import { fetchMenuItems, MenuItem } from "@/lib/menu-data"

type DeliveryOrder = {
  id: string
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

export default function DeliveryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orders, setOrders] = useState<DeliveryOrder[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
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

        const mapped = data.map((d: any) => {
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
        setOrders(mapped)
      } catch (err) {
        console.error('Failed to load deliveries', err)
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

  const markNext = (id: string) => {
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
      alert('Cannot update delivery status: order is not ready yet.')
      return
    }

    // Attempt update on server first
    ;(async () => {
      try {
        const next = nextStatusFor(o.status)
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/deliveries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        })

        if (res.status === 409) {
          const body = await res.json().catch(() => ({}))
          alert(body.error || 'Cannot update delivery status: order is not ready yet.')
          return
        }

        if (!res.ok) {
          throw new Error('failed')
        }

        const updated = await res.json()
        setOrders((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)))
      } catch (err) {
        console.error('Failed to update delivery status', err)
        alert('Failed to update delivery status. Please try again.')
      }
    })()
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Active</div>
              <div className="text-2xl font-bold">
                {filtered.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length}
              </div>
            </div>
            <Truck className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Delivered</div>
              <div className="text-2xl font-bold text-chart-2">
                {filtered.filter((o) => o.status === "delivered").length}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-chart-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Pending Payment</div>
              <div className="text-2xl font-bold text-destructive">
                {filtered.filter((o) => o.paymentStatus === "pending").length}
              </div>
            </div>
            <Clock className="w-8 h-8 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{filtered.length}</div>
            </div>
            <Phone className="w-8 h-8" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by ID, name, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">#{order.id}</CardTitle>
                <Badge className={getStatusBadge(order.status)}>{order.status.replaceAll("-", " ")}</Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Placed: {order.placedAt} {order.eta ? `• ETA: ${order.eta}` : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" /> {order.customerName} • {order.phone}
              </div>
              {order.tableNumber ? (
                <div className="text-sm text-muted-foreground">Delivery No: <span className="font-medium">{order.tableNumber}</span></div>
              ) : null}
              <div className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {order.address}
              </div>
              <div className="text-sm">
                <span className="font-medium">Items:</span>{" "}
                {order.items.map((i) => i.price ? `${i.quantity}x ${i.name} (₹${i.price})` : `${i.quantity}x ${i.name}`).join(", ")}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  Payment:{" "}
                  <Badge variant={order.paymentStatus === "completed" ? "secondary" : "outline"}>
                    {order.paymentMethod}
                  </Badge>
                </div>
                <div className="font-bold">₹{order.total}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => markNext(order.id)}>
                  Advance Status
                </Button>
                <Button size="sm" variant="outline" className="bg-transparent">
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
