"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderCard } from "@/components/order-card"
import { useOrderManager, type Order } from "@/hooks/use-order-manager"
import { Search, Filter, Plus, Clock, AlertTriangle, CheckCircle } from "lucide-react"

export function OrderManagement() {
  const { orders, getOrdersByStatus, getOrdersByPriority, updateOrderStatus, searchOrders } = useOrderManager()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "priority" | "table">("all")

  const handleOrderStatusUpdate = (orderId: string | number, newStatus: Order["status"]) => {
    updateOrderStatus(typeof orderId === 'string' ? parseInt(orderId) : orderId, newStatus)
  }

  const filteredOrders = searchQuery ? searchOrders(searchQuery) : orders

  const pendingOrders = getOrdersByStatus("pending")
  const preparingOrders = getOrdersByStatus("preparing")
  const readyOrders = getOrdersByStatus("ready")
  const highPriorityOrders = getOrdersByPriority("high")

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
          <p className="text-muted-foreground">Track and manage all restaurant orders</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold">{pendingOrders.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting start</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Preparing</p>
                <p className="text-3xl font-bold">{preparingOrders.length}</p>
                <p className="text-xs text-muted-foreground">In kitchen</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Ready</p>
                <p className="text-3xl font-bold">{readyOrders.length}</p>
                <p className="text-xs text-muted-foreground">To be served</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">High Priority</p>
                <p className="text-3xl font-bold">{highPriorityOrders.length}</p>
                <p className="text-xs text-muted-foreground">Urgent orders</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Card className="shadow-sm">
        <CardContent className="p-2">
          <Tabs defaultValue="all" className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-full min-w-max bg-transparent gap-1">
                <TabsTrigger value="all" className="whitespace-nowrap">All Orders ({filteredOrders.length})</TabsTrigger>
                <TabsTrigger value="pending" className="whitespace-nowrap">Pending ({pendingOrders.length})</TabsTrigger>
                <TabsTrigger value="preparing" className="whitespace-nowrap">Preparing ({preparingOrders.length})</TabsTrigger>
                <TabsTrigger value="ready" className="whitespace-nowrap">Ready ({readyOrders.length})</TabsTrigger>
                <TabsTrigger value="priority" className="whitespace-nowrap">High Priority ({highPriorityOrders.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                ))}
              </div>
              {filteredOrders.length === 0 && (
                <Card className="shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No orders found matching your search.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preparing" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {preparingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ready" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="priority" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {highPriorityOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
