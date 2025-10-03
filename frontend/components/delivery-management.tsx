"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, MapPin, Phone, Clock, CheckCircle, Search } from "lucide-react"

type DeliveryOrder = {
  id: string
  customerName: string
  phone: string
  address: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  status: "pending" | "preparing" | "out-for-delivery" | "delivered" | "cancelled"
  placedAt: string
  eta?: string
  notes?: string
  paymentStatus: "pending" | "completed" | "failed"
  paymentMethod: "UPI" | "Card" | "COD"
}

export function DeliveryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [orders, setOrders] = useState<DeliveryOrder[]>([
    {
      id: "DLV001",
      customerName: "Rohit Gupta",
      phone: "9876543210",
      address: "A-32, Sector 50, Noida",
      items: [
        { name: "Chicken Biryani", quantity: 1, price: 350 },
        { name: "Gulab Jamun", quantity: 2, price: 80 },
      ],
      total: 510,
      status: "preparing",
      placedAt: "12:45 PM",
      eta: "1:20 PM",
      paymentStatus: "completed",
      paymentMethod: "UPI",
    },
    {
      id: "DLV002",
      customerName: "Neha Sharma",
      phone: "9123456789",
      address: "Tower 3, Lotus Boulevard, Noida",
      items: [
        { name: "Paneer Tikka", quantity: 1, price: 280 },
        { name: "Butter Naan", quantity: 4, price: 60 },
      ],
      total: 520,
      status: "out-for-delivery",
      placedAt: "1:10 PM",
      eta: "1:50 PM",
      paymentStatus: "completed",
      paymentMethod: "Card",
    },
  ])

  const getStatusBadge = (s: DeliveryOrder["status"]) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      preparing: "bg-blue-100 text-blue-800",
      "out-for-delivery": "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return map[s]
  }

  const filtered = orders.filter((o) => {
    const matches =
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.address.toLowerCase().includes(searchTerm.toLowerCase())
    const statusOk = statusFilter === "all" || o.status === statusFilter
    return matches && statusOk
  })

  const markNext = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const flow: DeliveryOrder["status"][] = ["pending", "preparing", "out-for-delivery", "delivered"]
        const idx = flow.indexOf(o.status)
        return { ...o, status: flow[Math.min(flow.length - 1, idx + 1)] }
      }),
    )
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
              <SelectItem value="preparing">Preparing</SelectItem>
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
              <div className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {order.address}
              </div>
              <div className="text-sm">
                <span className="font-medium">Items:</span>{" "}
                {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
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
