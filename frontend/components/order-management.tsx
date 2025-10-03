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

  const handleOrderStatusUpdate = (orderId: number, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus)
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-destructive">{pendingOrders.length}</p>
              </div>
              <Clock className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl font-bold text-primary">{preparingOrders.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-chart-2">{readyOrders.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-destructive">{highPriorityOrders.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="preparing">Preparing ({preparingOrders.length})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({readyOrders.length})</TabsTrigger>
          <TabsTrigger value="priority">High Priority ({highPriorityOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
            ))}
          </div>
          {filteredOrders.length === 0 && (
            <Card>
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
    </div>
  )
}
