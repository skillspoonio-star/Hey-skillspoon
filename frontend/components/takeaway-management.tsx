"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Package, Clock, Phone, CreditCard, CheckCircle, Search, Eye, Printer, RefreshCw } from "lucide-react"

interface TakeawayOrder {
  id: string
  customerName: string
  phone: string
  email: string
  items: Array<{
    name: string
    quantity: number
    price: number
    specialInstructions?: string
  }>
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  orderTime: string
  pickupTime: string
  paymentMethod: string
  paymentStatus: "pending" | "completed" | "failed"
  specialInstructions?: string
}

export function TakeawayManagement() {
  const [selectedOrder, setSelectedOrder] = useState<TakeawayOrder | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("today")

  const [takeawayOrders, setTakeawayOrders] = useState<TakeawayOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const [ordersRes, menuRes] = await Promise.all([
          fetch(`${base}/api/orders`),
          fetch(`${base}/api/menu/items`),
        ])
        if (!ordersRes.ok) throw new Error('Failed to fetch orders')
        if (!menuRes.ok) throw new Error('Failed to fetch menu')
        const ordersData: any[] = await ordersRes.json()
        const menuData: any[] = await menuRes.json()
        const menuById = new Map(menuData.map((m: any) => [Number(m.id), m]))

        // Filter take-away orders and map to UI shape
        const takeaways = ordersData
          .filter((o: any) => {
            const t = (o.orderType || '').toString().toLowerCase()
            return t === 'take-away' || t === 'takeaway' || t === 'take away' || t === 'takeaway'
          })
          .map((o: any) => {
            const sourceItems = o.items || []
            const items = sourceItems.map((it: any) => {
              const menuItem = menuById.get(Number(it.itemId))
              return {
                name: menuItem ? menuItem.name : (it.name || `Item ${it.itemId}`),
                quantity: Number(it.quantity || 0),
                price: menuItem ? Number(menuItem.price) : Number(it.price || 0),
                specialInstructions: it.specialInstructions || undefined,
              }
            })

            return {
              id: String(o.tableNumber ?? o._id),
              customerName: o.customerName || o.customer || '',
              phone: o.customerPhone || o.phone || '',
              email: o.customerEmail || '',
              items,
              total: Number(o.total || items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0)),
              status: o.status || 'pending',
              orderTime: o.timestamp ? new Date(o.timestamp).toLocaleString() : (o.createdAt ? new Date(o.createdAt).toLocaleString() : ''),
              pickupTime: o.estimatedTime ? `${o.estimatedTime} mins` : '',
              paymentMethod: o.paymentMethod || 'pending',
              paymentStatus: o.paymentStatus || 'pending',
              specialInstructions: o.specialRequests || o.specialInstructions || '',
            } as TakeawayOrder
          })

        if (!mounted) return
        setTakeawayOrders(takeaways)
      } catch (err) {
        console.error('Failed to load takeaway orders', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredOrders = takeawayOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const ordersByStatus = {
    pending: filteredOrders.filter((o) => o.status === "pending").length,
    confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
    preparing: filteredOrders.filter((o) => o.status === "preparing").length,
    ready: filteredOrders.filter((o) => o.status === "ready").length,
    completed: filteredOrders.filter((o) => o.status === "completed").length,
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{ordersByStatus.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl font-bold text-orange-600">{ordersByStatus.preparing}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-green-600">{ordersByStatus.ready}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-blue-600">{ordersByStatus.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹12,450</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, phone, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#TK {order.id}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Pickup: {order.pickupTime}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{order.phone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-sm">Items ({order.items.length}):</p>
                {order.items.slice(0, 2).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-muted-foreground">+{order.items.length - 2} more items</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentMethod}</Badge>
                </div>
                <span className="font-bold text-lg">₹{order.total}</span>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Order Details - #TK {order.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Customer</Label>
                          <p className="text-sm">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.phone}</p>
                          <p className="text-sm text-muted-foreground">{order.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Order Info</Label>
                          <p className="text-sm">Order Time: {order.orderTime}</p>
                          <p className="text-sm">Pickup Time: {order.pickupTime}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <Label className="text-sm font-medium">Order Items</Label>
                        <div className="mt-2 space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">
                                  {item.quantity}x {item.name}
                                </span>
                                {item.specialInstructions && (
                                  <p className="text-xs text-muted-foreground mt-1">Note: {item.specialInstructions}</p>
                                )}
                              </div>
                              <span className="font-medium">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {order.specialInstructions && (
                        <div>
                          <Label className="text-sm font-medium">Special Instructions</Label>
                          <p className="text-sm mt-1 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            {order.specialInstructions}
                          </p>
                        </div>
                      )}

                      {/* Payment Info */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium">Payment</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentMethod}</Badge>
                            <span className="text-sm">{order.paymentStatus === "completed" ? "Paid" : "Pending"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">₹{order.total}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No takeaway orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Takeaway orders will appear here when customers place them"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
