"use client"

import { useState } from "react"
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
  ArrowLeft,
} from "lucide-react"
import { menuItems, categories, type MenuItem } from "@/lib/menu-data"
import Link from "next/link"

interface CartItem extends MenuItem {
  quantity: number
  specialInstructions?: string
  customizations?: string[]
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
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "paid"
  paymentMethod: "cash" | "card" | "upi" | "pending"
  orderTime: Date
  specialRequests?: string
  waiterId?: string
}

const tables = Array.from({ length: 20 }, (_, i) => ({
  number: i + 1,
  capacity: i < 10 ? 4 : i < 15 ? 6 : 8,
  status: Math.random() > 0.7 ? "occupied" : "available",
}))

export default function CounterOrdersPage() {
  const [activeOrders, setActiveOrders] = useState<CounterOrder[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCreateOrder, setShowCreateOrder] = useState(false)

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
      setCart([...cart, { ...item, quantity: 1 }])
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
    const tax = subtotal * 0.18 // 18% GST
    const discount = 0
    return { subtotal, tax, discount, total: subtotal + tax - discount }
  }

  const createOrder = () => {
    if (!selectedTable || !customerName || cart.length === 0) return

    const { subtotal, tax, discount, total } = calculateTotal()
    const newOrder: CounterOrder = {
      id: `CO${Date.now()}`,
      tableNumber: selectedTable,
      customerName,
      customerPhone,
      items: [...cart],
      subtotal,
      tax,
      discount,
      total,
      status: "pending",
      paymentMethod: "pending",
      orderTime: new Date(),
      specialRequests: specialRequests || undefined,
    }

    setActiveOrders([newOrder, ...activeOrders])

    // Reset form
    setCart([])
    setSelectedTable(null)
    setCustomerName("")
    setCustomerPhone("")
    setSpecialRequests("")
    setShowCreateOrder(false)
  }

  const updateOrderStatus = (orderId: string, status: CounterOrder["status"]) => {
    setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, status } : order)))
  }

  const updatePaymentMethod = (orderId: string, paymentMethod: CounterOrder["paymentMethod"]) => {
    setActiveOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, paymentMethod } : order)))
  }

  const deleteOrder = (orderId: string) => {
    setActiveOrders((orders) => orders.filter((order) => order.id !== orderId))
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

  if (showCreateOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-700 dark:to-amber-700 border-b border-orange-700 dark:border-orange-800 sticky top-0 z-10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateOrder(false)}
                  className="flex items-center gap-2 text-sm lg:text-base text-white hover:bg-white/20 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                  Back to Orders
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white">Create Counter Order</h1>
                  <p className="text-sm lg:text-base text-white/90 font-medium">
                    Select items and add customer details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-card shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b border-orange-200 dark:border-orange-800">
                  <CardTitle className="text-xl text-foreground">Select Menu Items</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search menu items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 text-lg border-2 border-border bg-background text-foreground focus:border-orange-400"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-56 h-12 border-2 border-border bg-background text-foreground">
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

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {filteredMenuItems.map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-300 dark:hover:border-orange-700 bg-card"
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="w-20 h-20 rounded-xl object-cover border-2 border-border"
                              />
                              {item.isPopular && (
                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                                  <Star className="w-3 h-3 fill-current" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground text-base">{item.name}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={item.isVeg ? "secondary" : "destructive"} className="text-xs">
                                      {item.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                                    </Badge>
                                    {item.spiceLevel && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Spice:</span>
                                        <div className="flex">
                                          {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                              key={i}
                                              className={`w-2 h-2 rounded-full mr-0.5 ${
                                                i < item.spiceLevel! ? "bg-red-500" : "bg-muted"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {item.preparationTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{item.preparationTime}min</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right space-y-2 flex-shrink-0">
                                  <p className="font-bold text-lg text-foreground">₹{item.price}</p>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
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

            <div className="space-y-6">
              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-card shadow-lg sticky top-24">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b border-orange-200 dark:border-orange-800">
                  <CardTitle className="text-xl text-foreground">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Customer Details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="table" className="text-base font-semibold text-foreground mb-2 block">
                        Table Number
                      </Label>
                      <Select
                        value={selectedTable?.toString() || ""}
                        onValueChange={(value) => setSelectedTable(Number(value))}
                      >
                        <SelectTrigger className="h-14 border-2 border-border bg-background text-foreground text-base">
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables
                            .filter((table) => table.status === "available")
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
                      <Label htmlFor="customerName" className="text-base font-semibold text-foreground mb-2 block">
                        Customer Name
                      </Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        className="h-14 border-2 border-border bg-background text-foreground text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerPhone" className="text-base font-semibold text-foreground mb-2 block">
                        Phone Number
                      </Label>
                      <Input
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="h-14 border-2 border-border bg-background text-foreground text-base"
                      />
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Cart Items */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground text-base">Items ({cart.length})</h4>
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No items added yet</p>
                        <p className="text-xs mt-1">Select items from the menu</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted/30 rounded-lg border-2 border-border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="h-8 w-8 p-0 border-border"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="font-medium w-8 text-center text-foreground">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-8 w-8 p-0 border-border"
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

                  <Separator className="bg-border" />

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="specialRequests" className="text-base font-semibold text-foreground mb-2 block">
                      Special Requests
                    </Label>
                    <Textarea
                      id="specialRequests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special instructions..."
                      className="h-24 border-2 border-border bg-background text-foreground text-base resize-none"
                    />
                  </div>

                  {/* Bill Summary */}
                  {cart.length > 0 && (
                    <>
                      <Separator className="bg-border" />
                      <div className="space-y-2 bg-muted/50 dark:bg-muted/30 p-4 rounded-lg border-2 border-border">
                        <div className="flex justify-between text-sm text-foreground">
                          <span>Subtotal:</span>
                          <span className="font-medium">₹{calculateTotal().subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm text-foreground">
                          <span>Tax (18%):</span>
                          <span className="font-medium">₹{calculateTotal().tax.toFixed(2)}</span>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between font-bold text-lg text-foreground">
                          <span>Total:</span>
                          <span className="text-orange-600 dark:text-orange-400">
                            ₹{calculateTotal().total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={createOrder}
                    disabled={!selectedTable || !customerName || cart.length === 0}
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-700 dark:to-amber-700 border-b border-orange-700 dark:border-orange-800 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm lg:text-base text-white hover:bg-white/20 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white">Counter Orders</h1>
                <p className="text-sm lg:text-base text-white/90 mt-1 font-medium">
                  Create and manage walk-in customer orders efficiently
                </p>
              </div>
              <Button
                onClick={() => setShowCreateOrder(true)}
                className="bg-white hover:bg-white/90 text-orange-600 shadow-lg text-sm lg:text-base px-4 lg:px-6 h-10 lg:h-12 font-semibold"
              >
                <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                New Counter Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm lg:text-base text-muted-foreground">Active Orders</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                    {activeOrders.length}
                  </p>
                </div>
                <Receipt className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm lg:text-base text-muted-foreground">Available Tables</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {tables.filter((t) => t.status === "available").length}
                  </p>
                </div>
                <Users className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm lg:text-base text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    ₹{activeOrders.reduce((sum, order) => sum + order.total, 0).toFixed(0)}
                  </p>
                </div>
                <Receipt className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm lg:text-base text-muted-foreground">Completed Orders</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {activeOrders.filter((order) => order.status === "paid").length}
                  </p>
                </div>
                <Star className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <div className="space-y-6">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Active Orders</h2>

          {activeOrders.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-card">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Counter Orders</h3>
                <p className="text-muted-foreground mb-6">Create your first counter order for walk-in customers</p>
                <Button
                  onClick={() => setShowCreateOrder(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Counter Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
              {activeOrders.map((order) => (
                <Card
                  key={order.id}
                  className="hover:shadow-xl transition-all duration-200 border-2 hover:border-orange-300 dark:hover:border-orange-700 min-h-[600px] lg:min-h-[650px] flex flex-col bg-card"
                >
                  <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl lg:text-2xl text-foreground">Table {order.tableNumber}</CardTitle>
                        <p className="text-base lg:text-lg text-muted-foreground font-medium mt-1">
                          {order.customerName}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(order.status)} font-medium text-sm lg:text-base px-3 py-1 border`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 lg:space-y-5 flex-1 flex flex-col p-5 lg:p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="font-mono font-medium text-foreground">{order.id}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium text-foreground">{order.orderTime.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{order.customerPhone}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-base lg:text-lg text-foreground">
                        Items ({order.items.length})
                      </h4>
                      <div className="space-y-2 max-h-72 lg:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm lg:text-base p-3 bg-muted/50 dark:bg-muted/30 rounded border border-border"
                          >
                            <span className="font-medium text-foreground">
                              {item.name} x{item.quantity}
                            </span>
                            <span className="font-semibold text-foreground">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold text-lg lg:text-xl">
                      <span className="text-foreground">Total:</span>
                      <span className="text-orange-600 dark:text-orange-400">₹{order.total.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm lg:text-base font-medium text-foreground">Payment Method</Label>
                      <Select
                        value={order.paymentMethod}
                        onValueChange={(value) => updatePaymentMethod(order.id, value as CounterOrder["paymentMethod"])}
                      >
                        <SelectTrigger className="h-11 lg:h-12 text-sm lg:text-base border-border bg-background text-foreground">
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
                      <Label className="text-sm lg:text-base font-medium text-foreground">Order Status</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "confirmed")}
                            className="text-sm lg:text-base h-10 lg:h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Confirm
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "preparing")}
                            className="text-sm lg:text-base h-10 lg:h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="text-sm lg:text-base h-10 lg:h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "served")}
                            className="text-sm lg:text-base h-10 lg:h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Mark Served
                          </Button>
                        )}
                        {order.status === "served" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "paid")}
                            className="text-sm lg:text-base h-10 lg:h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteOrder(order.id)}
                          className="text-sm lg:text-base h-10 lg:h-11"
                        >
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {order.specialRequests && (
                      <div className="space-y-1">
                        <Label className="text-sm lg:text-base font-medium text-foreground">Special Requests</Label>
                        <p className="text-sm lg:text-base text-foreground bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded border border-yellow-200 dark:border-yellow-900">
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
      </div>
    </div>
  )
}
