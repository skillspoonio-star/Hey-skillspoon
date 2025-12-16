"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Minus,
  Receipt,
  Trash2,
  Utensils,
  Coffee,
  Pizza,
  IceCream,
  Clock,
  Star,
  Users,
  Search,
} from "lucide-react"
import { fetchMenuItems, categories, type MenuItem } from "@/lib/menu-data"
import { fetchAvailableTables, SimpleTable } from "@/lib/tables"

interface CartItem extends MenuItem {
  quantity: number
  itemId:number
}

interface CounterOrder {
  id: string
  tableNumber: number
  customerName: string
  customerPhone: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "paid" | "cancelled"
  paymentMethod: "cash" | "card" | "upi" | "pending"
  orderTime: Date
  specialRequests?: string
  waiterId?: string
}
export function CounterOrderManagement() {
  const [activeOrders, setActiveOrders] = useState<CounterOrder[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<CounterOrder | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<SimpleTable[]>([])

  // ...existing code...
useEffect(() => {
  ;(async () => {
    try {
      // 1) load menu items to resolve itemId -> name/price
      let menu: MenuItem[] = []
      try {
        menu = await fetchMenuItems()
        setMenuItems(menu)
      } catch (err) {
        console.error('Failed to load menu items', err)
      }

      // 2) load available tables 
      try {
        const avail = await fetchAvailableTables()
        setTables(avail)
      } catch (err) {
        console.error('Failed to load available tables', err)
      }
      // 3) Fetch counter orders and map itemIds to menu data
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const res = await fetch(`${base}/api/orders/counter`)
      if (!res.ok) {
        const text = await res.text()
        console.error('Failed to fetch counter orders', res.status, text)
        return
      }
      const liveOrders = await res.json()
      if (!Array.isArray(liveOrders)) return

      const mapped: CounterOrder[] = liveOrders.map((o: any) => ({
        id: String(o._id || o.id || `CO${Date.now()}`),
        tableNumber: o.tableNumber,
        customerName: o.customerName || o.customer || '',
        customerPhone: o.customerPhone || o.phone || '',
        items: (o.items || []).map((it: any) => {
          const itemId = Number(it.itemId ?? it.id ?? 0)
          const menuItem = menu.find((m) => Number(m.id) === itemId)
          return {
            id: itemId,
            itemId,
            name: menuItem?.name || it.name || `Item ${itemId}`,
            price: Number(menuItem?.price ?? it.price ?? 0),
            description: menuItem?.description ?? it.description ?? '',
            image: menuItem?.image ?? it.image ?? '',
            category: menuItem?.category ?? it.category ?? 'Misc',
            isVeg: menuItem?.isVeg ?? it.isVeg ?? true,
            quantity: Number(it.quantity || 1),
          }
        }),
        subtotal: Number(o.subtotal || 0),
        tax: Number(o.tax || 0),
        discount: Number(o.discount || 0),
        total: Number(o.total || 0),
        status: (o.status as CounterOrder['status']) || 'pending',
        paymentMethod: (o.paymentMethod as CounterOrder['paymentMethod']) || 'pending',
        orderTime: o.timestamp ? new Date(o.timestamp) : o.createdAt ? new Date(o.createdAt) : new Date(),
        specialRequests: o.specialRequests || undefined,
      }))

      setActiveOrders(mapped)
    } catch (err) {
      console.error('Error fetching live orders', err)
    }
  })()
}, [])
// ...existing code...
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    if (existingItem) {
      setCart(
        cart.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)),
      )
    } else {
      setCart([...cart, { ...item, itemId:item.id,quantity: 1 }])
    }
  }

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
    }
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.18
    const discount = 0
    return {subtotal,tax,discount,total:subtotal + tax - discount}
  }

  const createOrder = async () => {
    if (!selectedTable || !customerName || cart.length === 0) return

    const {subtotal,tax,discount,total} = calculateTotal()

    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
    const url = `${base}/api/orders`

    const payload = {
      tableNumber: selectedTable,
      customerName,
      customerPhone,
      items: cart.map((c) => ({ itemId: c.itemId ?? c.id, quantity: c.quantity })),
      total,
      subtotal,
      tax,
      discount,
      specialRequests: specialRequests || undefined,
      orderType: 'dine-in',
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Failed to create order', res.status, text)
        return
      }
      const data = await res.json()
      const orderId = data && (data.orderId || data.orderID || data.id)
      const newOrder: CounterOrder = {
        id: String(orderId || `CO${Date.now()}`),
        tableNumber: selectedTable,
        customerName,
        customerPhone,
        items: [...cart],
        subtotal,
        tax,
        discount,
        total,
        status: 'pending',
        paymentMethod: 'cash',
        orderTime: new Date(),
        specialRequests: specialRequests || undefined,
      }

      setActiveOrders([newOrder, ...activeOrders])
      setCart([])
      setSelectedTable(null)
      setCustomerName('')
      setCustomerPhone('')
      setSpecialRequests('')
      setShowCreateOrder(false)

      // remove the table from available list locally (backend will mark it occupied)
      setTables((prev) => prev.filter((t) => t.number !== selectedTable))
    } catch (err) {
      console.error('Create order failed', err)
    }
  }

  const updateOrderStatus = (orderId: string, status: CounterOrder["status"]) => {
    // Optimistically update UI
    setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, status } : order)))

    ;(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Failed to update order status', res.status, text)
          return
        }
        const updated = await res.json()
        // sync with server response if provided
        setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, status: updated.status ?? status } : order)))
      } catch (err) {
        console.error('Error updating order status', err)
      }
    })()
  }

  const updatePaymentMethod = (orderId: string, paymentMethod: CounterOrder["paymentMethod"]) => {
    setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, paymentMethod } : order)))

    ;(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod }),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Failed to update payment method', res.status, text)
          return
        }
        const updated = await res.json()
        setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, paymentMethod: updated.paymentMethod ?? paymentMethod } : order)))
      } catch (err) {
        console.error('Error updating payment method', err)
      }
    })()
  }

  const deleteOrder = (orderId: string) => {
  // set status to 'cancelled' locally and on server
  setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, status: 'cancelled' } : order)))

    ;(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Failed to cancel order', res.status, text)
          return
        }
        const updated = await res.json()
        setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, status: updated.status ?? 'cancelled' } : order)))
      } catch (err) {
        console.error('Error cancelling order', err)
      }
    })()
  }

  const getStatusColor = (status: CounterOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-700"
      case "confirmed":
        return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700"
      case "preparing":
        return "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700"
      case "ready":
        return "bg-green-100 text-green-900 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-700"
      case "served":
        return "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-700"
      case "paid":
        return "bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
      default:
        return "bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Main Course":
        return <Utensils className="w-4 h-4" />
      case "Beverages":
        return <Coffee className="w-4 h-4" />
      case "Rice & Biryani":
        return <Pizza className="w-4 h-4" />
      case "Desserts":
        return <IceCream className="w-4 h-4" />
      default:
        return <Utensils className="w-4 h-4" />
    }
  }

  const filteredOrders = activeOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const ordersByStatus = {
    pending: activeOrders.filter((o) => o.status === "pending").length,
    confirmed: activeOrders.filter((o) => o.status === "confirmed").length,
    preparing: activeOrders.filter((o) => o.status === "preparing").length,
    ready: activeOrders.filter((o) => o.status === "ready").length,
    served: activeOrders.filter((o) => o.status === "served").length,
    paid: activeOrders.filter((o) => o.status === "paid").length,
  }

  if (showCreateOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create Counter Order</h2>
            <p className="text-muted-foreground">Select items and add customer details</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreateOrder(false)}>
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b">
                <CardTitle className="text-xl">Select Menu Items</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-56 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {category}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-all border-2 hover:border-orange-300">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-20 h-20 rounded-xl object-cover"
                            />
                            {item.isPopular && (
                              <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                                <Star className="w-3 h-3 fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <h4 className="font-semibold text-base">{item.name}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={item.isVeg ? "secondary" : "destructive"} className="text-xs">
                                    {item.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                                  </Badge>
                                  {item.preparationTime && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{item.preparationTime}min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="font-bold text-lg">₹{item.price}</p>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <Card className="border-2 border-orange-200 dark:border-orange-800 sticky top-4">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b">
                <CardTitle className="text-xl">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="table" className="text-base font-semibold mb-2 block">
                      Table Number
                    </Label>
                    <Select
                      value={selectedTable?.toString() || ""}
                      onValueChange={(value) => setSelectedTable(Number(value))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables
                          .map((table) => (
                            <SelectItem key={table.number} value={table.number.toString()}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Table {table.number} ({table.capacity} seats)
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customerName" className="text-base font-semibold mb-2 block">
                      Customer Name
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone" className="text-base font-semibold mb-2 block">
                      Phone Number
                    </Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="h-12"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Items ({cart.length})</h4>
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No items added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label htmlFor="specialRequests" className="text-base font-semibold mb-2 block">
                    Special Requests
                  </Label>
                  <Textarea
                    id="specialRequests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special instructions..."
                    className="h-24 resize-none"
                  />
                </div>

                {cart.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{calculateTotal().subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (18%):</span>
                        <span className="font-medium">₹{calculateTotal().tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-orange-600">₹{calculateTotal().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  onClick={createOrder}
                  disabled={!selectedTable || !customerName || cart.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold"
                >
                  Create Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">{activeOrders.length}</p>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Users className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Available Tables</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500">{tables.length}</p>
                <p className="text-xs text-muted-foreground">Ready to use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                  ₹{activeOrders.reduce((sum, order) => sum + order.total, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Total earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-500">{ordersByStatus.paid}</p>
                <p className="text-xs text-muted-foreground">Orders served</p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                  ₹{activeOrders.length > 0 ? (activeOrders.reduce((sum, order) => sum + order.total, 0) / activeOrders.length).toFixed(0) : '0'}
                </p>
                <p className="text-xs text-muted-foreground">Per order</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
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
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateOrder(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Counter Orders</h3>
            <p className="text-muted-foreground mb-6">Create your first counter order for walk-in customers</p>
            <Button onClick={() => setShowCreateOrder(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Counter Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-xl transition-all border-2 hover:border-orange-300">
              <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <div>{
                    <CardTitle className="text-xl">Table {order.tableNumber}</CardTitle>}
                    <p className="text-base text-muted-foreground font-medium mt-1">{order.customerName}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} font-medium text-sm px-3 py-1 border`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono font-medium">{order.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{order.orderTime.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{order.customerPhone}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 flex-1">
                  <h4 className="font-semibold text-base">Items ({order.items.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                        <span className="font-medium">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-orange-600">₹{order.total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select
                    value={order.paymentMethod}
                    onValueChange={(value) => updatePaymentMethod(order.id, value as CounterOrder["paymentMethod"])}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "confirmed")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Confirm
                      </Button>
                    )}
                    {order.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "served")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Mark Served
                      </Button>
                    )}
                    {order.status === "served" && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "paid")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Mark Paid
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteOrder(order.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {order.specialRequests && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Special Requests</Label>
                    <p className="text-sm bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded border border-yellow-200 dark:border-yellow-900">
                      {order.specialRequests}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
