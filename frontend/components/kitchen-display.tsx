"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Clock,
  ChefHat,
  CheckCircle,
  AlertTriangle,
  Timer,
  Users,
  Volume2,
  Utensils,
  Eye,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Order } from "@/hooks/use-order-manager"

interface KitchenDisplayProps {
  orders: Order[]
  onStatusUpdate: (orderId: number, newStatus: Order["status"]) => void
}

interface StationStatus {
  id: string
  name: string
  currentOrders: number
  maxCapacity: number
  avgCookTime: number
  status: "available" | "busy" | "overloaded"
}

export function KitchenDisplay({ orders, onStatusUpdate }: KitchenDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sortBy, setSortBy] = useState<"priority" | "time" | "table">("priority")
  const [filterBy, setFilterBy] = useState<"all" | "pending" | "preparing">("all")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [stationView, setStationView] = useState(false)
  const [orderTypeFilter, setOrderTypeFilter] = useState<"all" | "dine-in" | "take-away" | "delivery">("all")

  const kitchenStations: StationStatus[] = [
    {
      id: "grill",
      name: "Grill Station",
      currentOrders: orders.filter(
        (o) =>
          o.items.some((item) => ["Paneer Tikka", "Chicken Tikka"].includes(item.name)) && o.status === "preparing",
      ).length,
      maxCapacity: 4,
      avgCookTime: 18,
      status: "available",
    },
    {
      id: "curry",
      name: "Curry Station",
      currentOrders: orders.filter(
        (o) =>
          o.items.some((item) => ["Dal Makhani", "Butter Chicken"].includes(item.name)) && o.status === "preparing",
      ).length,
      maxCapacity: 6,
      avgCookTime: 22,
      status: "busy",
    },
    {
      id: "biryani",
      name: "Biryani Station",
      currentOrders: orders.filter(
        (o) => o.items.some((item) => item.name.includes("Biryani")) && o.status === "preparing",
      ).length,
      maxCapacity: 3,
      avgCookTime: 35,
      status: "available",
    },
    {
      id: "tandoor",
      name: "Tandoor Station",
      currentOrders: orders.filter(
        (o) => o.items.some((item) => ["Butter Naan", "Garlic Naan"].includes(item.name)) && o.status === "preparing",
      ).length,
      maxCapacity: 8,
      avgCookTime: 8,
      status: "available",
    },
    {
      id: "dessert",
      name: "Dessert Station",
      currentOrders: orders.filter(
        (o) => o.items.some((item) => ["Gulab Jamun", "Kulfi"].includes(item.name)) && o.status === "preparing",
      ).length,
      maxCapacity: 5,
      avgCookTime: 5,
      status: "available",
    },
  ]

  // Update station status based on load
  kitchenStations.forEach((station) => {
    const loadPercentage = (station.currentOrders / station.maxCapacity) * 100
    if (loadPercentage >= 90) station.status = "overloaded"
    else if (loadPercentage >= 60) station.status = "busy"
    else station.status = "available"
  })

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Play sound for new orders or urgent orders
  useEffect(() => {
    if (soundEnabled) {
      const urgentOrders = orders.filter((order) => {
        const minutesElapsed = Math.floor((currentTime.getTime() - order.timestamp.getTime()) / (1000 * 60))
        return minutesElapsed > 25 && (order.status === "pending" || order.status === "preparing")
      })

      if (urgentOrders.length > 0) {
        // In a real app, you would play an actual sound here
      }
    }
  }, [orders, currentTime, soundEnabled])

  const activeOrders = orders.filter((order) => {
    const statusOk =
      filterBy === "all" ? order.status === "pending" || order.status === "preparing" : order.status === filterBy
    const typeOk = orderTypeFilter === "all" ? true : (order.orderType || "dine-in") === orderTypeFilter
    return statusOk && typeOk
  })

  const getOrderPriority = (order: Order) => {
    const minutesElapsed = Math.floor((currentTime.getTime() - order.timestamp.getTime()) / (1000 * 60))
    if (minutesElapsed > 65) return "urgent"
    if (minutesElapsed > 35) return "high"
    if (minutesElapsed > 15) return "medium"
    return "low"
  }

  const getOrderDisplay = (order: Order) => {
    const type = (order.orderType || 'dine-in')
    if (type === 'take-away') return `#TK${order.tableNumber}`
    if (type === 'delivery') return `#DLV${order.tableNumber}`
    return `Table ${order.tableNumber}`
  }

  const getOrderNumericId = (order: Order) => {
    if (typeof order.id === 'number') return order.id
    const parsed = parseInt(String(order.id || ''), 10)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getTruncatedOrderId = (order: Order) => {
    const id = String(order.id || '')
    // If ID is longer than 10 characters, truncate it
    if (id.length > 10) {
      return `#${id.substring(0, 8)}...`
    }
    return `#${id}`
  }

  const formatTimeUnit = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours}h`
      }
      return `${hours}h ${remainingMinutes}m`
    } else { // 24 hours or more
      const days = Math.floor(minutes / 1440)
      const remainingHours = Math.floor((minutes % 1440) / 60)
      if (remainingHours === 0) {
        return `${days}d`
      }
      return `${days}d ${remainingHours}h`
    }
  }

  const formatElapsedTime = (timestamp: Date) => {
    const elapsed = Math.floor((currentTime.getTime() - timestamp.getTime()) / (1000 * 60))
    return formatTimeUnit(elapsed)
  }

  const getEstimatedCompletionTime = (order: Order) => {
    const baseTime = order.items.reduce((total, item) => {
      // Estimate cooking time based on item type (simplified)
      const cookingTimes: Record<string, number> = {
        "Chicken Biryani": 25,
        "Dal Makhani": 15,
        "Paneer Tikka": 20,
        "Butter Naan": 8,
        "Mango Lassi": 3,
        "Gulab Jamun": 5,
      }
      return total + (cookingTimes[item.name] || 10) * item.quantity
    }, 0)

    const completionTime = new Date(order.timestamp.getTime() + baseTime * 60 * 1000)
    return completionTime
  }

  const getCookingProgress = (order: Order) => {
    if (order.status !== "preparing") return 0
    const minutesElapsed = Math.floor((currentTime.getTime() - order.timestamp.getTime()) / (1000 * 60))
    const estimatedTime = order.items.reduce((total, item) => {
      const cookingTimes: Record<string, number> = {
        "Chicken Biryani": 25,
        "Dal Makhani": 15,
        "Paneer Tikka": 20,
        "Butter Naan": 8,
        "Mango Lassi": 3,
        "Gulab Jamun": 5,
      }
      return Math.max(total, cookingTimes[item.name] || 10)
    }, 0)

    return Math.min((minutesElapsed / estimatedTime) * 100, 100)
  }

  const sortedOrders = [...activeOrders].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[getOrderPriority(a)]
      const bPriority = priorityOrder[getOrderPriority(b)]
      if (aPriority !== bPriority) return bPriority - aPriority
    }

    if (sortBy === "time") {
      return a.timestamp.getTime() - b.timestamp.getTime()
    }

    if (sortBy === "table") {
      return a.tableNumber - b.tableNumber
    }

    return 0
  })

  const pendingCount = orders.filter((o) => o.status === "pending").length
  const preparingCount = orders.filter((o) => o.status === "preparing").length
  const urgentCount = orders.filter((o) => getOrderPriority(o) === "urgent").length
  // Active tables should count only unique table numbers for dine-in orders
  const activeDineInTables = new Set(activeOrders.filter((o) => (o.orderType || 'dine-in') === 'dine-in').map((o) => o.tableNumber)).size

  return (
    <div className="space-y-6">
      {/* Kitchen Controls */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full">
            <div className="flex gap-2">
              <Button
                variant={soundEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex-1 sm:flex-none"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Sound {soundEnabled ? "On" : "Off"}
              </Button>

              <Button
                variant={stationView ? "default" : "outline"}
                size="sm"
                onClick={() => setStationView(!stationView)}
                className="flex-1 sm:flex-none"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Station View
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-32 bg-background text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-full sm:w-32 bg-background text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={orderTypeFilter} onValueChange={(value: any) => setOrderTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-36 bg-background text-foreground border-border">
                  <SelectValue placeholder="Order Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dine-in">Dine-in</SelectItem>
                  <SelectItem value="take-away">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Awaiting start</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Preparing</p>
                <p className="text-3xl font-bold text-primary">{preparingCount}</p>
                <p className="text-xs text-muted-foreground">In kitchen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{urgentCount}</p>
                <p className="text-xs text-muted-foreground">High priority</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Tables</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                  {activeDineInTables}
                </p>
                <p className="text-xs text-muted-foreground">Dining now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Timer className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Prep Time</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                  {formatTimeUnit(
                    Math.round(
                      activeOrders.reduce((acc, order) => {
                        const elapsed = Math.floor((currentTime.getTime() - order.timestamp.getTime()) / (1000 * 60))
                        return acc + elapsed
                      }, 0) / Math.max(activeOrders.length, 1),
                    )
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Average time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stationView && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Utensils className="w-5 h-5" />
              Kitchen Stations Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {kitchenStations.map((station) => (
                <Card
                  key={station.id}
                  className={cn(
                    "transition-all duration-200 border-2",
                    station.status === "overloaded" && "border-destructive bg-destructive/10 dark:bg-destructive/20",
                    station.status === "busy" && "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
                    station.status === "available" && "border-green-500 bg-green-50 dark:bg-green-950/30",
                  )}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-xs md:text-sm text-foreground">{station.name}</h4>
                        <Badge
                          variant={
                            station.status === "overloaded"
                              ? "destructive"
                              : station.status === "busy"
                                ? "secondary"
                                : "default"
                          }
                          className="text-xs"
                        >
                          {station.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-foreground">
                          <span>Load</span>
                          <span>
                            {station.currentOrders}/{station.maxCapacity}
                          </span>
                        </div>
                        <Progress value={(station.currentOrders / station.maxCapacity) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        <span>Avg: {formatTimeUnit(station.avgCookTime)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kitchen Tabs */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {sortedOrders.map((order) => {
              const priority = getOrderPriority(order)
              const elapsedTime = formatElapsedTime(order.timestamp)
              const estimatedCompletion = getEstimatedCompletionTime(order)
              const cookingProgress = getCookingProgress(order)

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-lg cursor-pointer min-h-[450px] flex flex-col bg-card border-2",
                    priority === "urgent" &&
                    "border-destructive bg-destructive/10 dark:bg-destructive/20 animate-pulse",
                    priority === "high" && "border-destructive/70 bg-destructive/5 dark:bg-destructive/10",
                    priority === "medium" && "border-primary/70 bg-primary/5 dark:bg-primary/10",
                    order.status === "preparing" && "ring-2 ring-primary shadow-primary/20",
                  )}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardHeader className="pb-3 p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base md:text-lg text-foreground">{getOrderDisplay(order)}</h3>
                        <Badge
                          variant={order.status === "pending" ? "destructive" : "default"}
                          className="capitalize text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize text-xs">
                          {order.orderType || "dine-in"}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="text-xs cursor-help">
                                {getOrderDisplay(order).startsWith('Table') ? getTruncatedOrderId(order) : getOrderDisplay(order)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Full Order ID: #{order.id}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {priority === "urgent" && <AlertTriangle className="w-4 h-4 text-destructive animate-bounce" />}
                        {priority === "high" && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs md:text-sm font-medium",
                            priority === "urgent" && "text-destructive font-bold",
                            priority === "high" && "text-destructive",
                            priority === "medium" && "text-primary",
                            priority === "low" && "text-muted-foreground",
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          {elapsedTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                      <span>{order.customerName || "Walk-in"}</span>
                      <Badge variant="outline" className="text-xs">
                        {order.orderType || "dine-in"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-4 md:p-6 pt-0 flex-1 flex flex-col">
                    {order.status === "preparing" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-foreground">
                          <span>Cooking Progress</span>
                          <span className="font-medium">{Math.round(cookingProgress)}%</span>
                        </div>
                        <Progress value={cookingProgress} className="h-2" />
                      </div>
                    )}

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start gap-2 p-2 bg-muted/50 dark:bg-muted/30 rounded border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-xs md:text-sm break-words text-foreground">
                              {item.quantity}x {item.name}
                            </span>
                            {item.specialInstructions && (
                              <p className="text-xs text-muted-foreground mt-1 break-words">
                                {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            ₹{item.price * item.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Timer className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Est. completion: {estimatedCompletion.toLocaleTimeString()}</span>
                    </div>

                    <div className="border-t border-border pt-2">
                      <div className="flex justify-between items-center font-semibold text-sm md:text-base text-foreground">
                        <span>Total</span>
                        <span>₹{order.total}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      {order.status === "pending" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusUpdate(getOrderNumericId(order), "preparing")
                          }}
                          className="flex-1"
                          size="sm"
                          variant={priority === "urgent" ? "destructive" : "default"}
                        >
                          <ChefHat className="w-4 h-4 mr-2" />
                          Start Cooking
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusUpdate(getOrderNumericId(order), "ready")
                          }}
                          className="flex-1"
                          size="sm"
                          variant="secondary"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Ready
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Order Details Panel */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Order Details</h3>
              {selectedOrder ? (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <CardTitle className="text-base md:text-lg text-foreground">
                        {selectedOrder.orderType && selectedOrder.orderType !== 'dine-in' ? (
                          <>{getOrderDisplay(selectedOrder)} - Order {getTruncatedOrderId(selectedOrder)}</>
                        ) : (
                          <>Table {selectedOrder.tableNumber} - Order {getTruncatedOrderId(selectedOrder)}</>
                        )}
                      </CardTitle>
                      <Badge variant={selectedOrder.status === "pending" ? "destructive" : "default"}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-foreground">Customer</p>
                        <p className="text-muted-foreground">{selectedOrder.customerName || "Walk-in"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Order Time</p>
                        <p className="text-muted-foreground">{selectedOrder.timestamp.toLocaleTimeString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Elapsed Time</p>
                        <p className="text-muted-foreground">{formatElapsedTime(selectedOrder.timestamp)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Priority</p>
                        <Badge variant={getOrderPriority(selectedOrder) === "urgent" ? "destructive" : "secondary"}>
                          {getOrderPriority(selectedOrder)}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3 text-foreground">Items to Prepare</h4>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-card">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium break-words text-foreground">
                                  {item.quantity}x {item.name}
                                </p>
                                <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                              </div>
                              <Badge variant="outline" className="flex-shrink-0">
                                ₹{item.price * item.quantity}
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border-l-4 border-amber-400 dark:border-amber-600">
                                <p className="text-sm text-amber-800 dark:text-amber-200 break-words">
                                  <strong>Special Instructions:</strong> {item.specialInstructions}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center font-semibold text-base md:text-lg text-foreground">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {selectedOrder.status === "pending" && (
                        <Button onClick={() => onStatusUpdate(getOrderNumericId(selectedOrder), "preparing")} className="flex-1">
                          <ChefHat className="w-4 h-4 mr-2" />
                          Start Cooking
                        </Button>
                      )}
                      {selectedOrder.status === "preparing" && (
                        <Button
                          onClick={() => onStatusUpdate(getOrderNumericId(selectedOrder), "ready")}
                          className="flex-1"
                          variant="secondary"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Ready
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-4 bg-muted rounded-full">
                        <Eye className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">No Order Selected</h3>
                        <p className="text-sm text-muted-foreground">
                          Select an order from the grid view to see detailed information
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Kitchen Analytics Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Kitchen Analytics</h3>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {orders.filter((o) => o.status === "served").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed Today</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-chart-2">
                        {formatTimeUnit(
                          Math.round(
                            orders
                              .filter((o) => o.status === "served")
                              .reduce((acc, order) => {
                                const elapsed = Math.floor(
                                  (new Date().getTime() - order.timestamp.getTime()) / (1000 * 60),
                                )
                                return acc + elapsed
                              }, 0) / Math.max(orders.filter((o) => o.status === "served").length, 1),
                          )
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Completion</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 text-foreground">Most Ordered Items</h4>
                    <div className="space-y-2">
                      {(() => {
                        const itemCounts: Record<string, number> = {}
                        orders.forEach((order) => {
                          order.items.forEach((item) => {
                            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
                          })
                        })

                        return Object.entries(itemCounts)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center">
                              <span className="text-sm text-foreground">{name}</span>
                              <Badge variant="outline">{count}x</Badge>
                            </div>
                          ))
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-4">
            {sortedOrders.map((order) => {
              const priority = getOrderPriority(order)
              const elapsedTime = formatElapsedTime(order.timestamp)

              return (
                <Card key={order.id} className="p-4 bg-card border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        {
                          order.orderType === "dine-in"
                        }
                        <div className="font-bold text-lg text-foreground">Table {order.tableNumber}</div>
                        <div className="text-xs text-muted-foreground">{elapsedTime}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={order.status === "pending" ? "destructive" : "default"}>{order.status}</Badge>
                          {priority === "urgent" && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              URGENT
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-foreground">
                          {order.items.map((item, index) => (
                            <span key={index}>
                              {item.quantity}x {item.name}
                              {index < order.items.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">₹{order.total}</span>
                      {order.status === "pending" && (
                        <Button onClick={() => onStatusUpdate(getOrderNumericId(order), "preparing")} size="sm">
                          <ChefHat className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button onClick={() => onStatusUpdate(getOrderNumericId(order), "ready")} size="sm" variant="secondary">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ready
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <h3 className="font-semibold text-foreground">Items to Prepare</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const itemCounts: Record<string, number> = {}
                    activeOrders.forEach((order) => {
                      order.items.forEach((item) => {
                        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
                      })
                    })

                    return Object.entries(itemCounts).map(([name, count]) => (
                      <div key={name} className="flex justify-between items-center">
                        <span className="text-foreground">{name}</span>
                        <Badge variant="outline">{count}x</Badge>
                      </div>
                    ))
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <h3 className="font-semibold text-foreground">Table Status</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(new Set(activeOrders.map((o) => o.tableNumber)))
                    .sort((a, b) => a - b)
                    .map((tableNumber) => {
                      const tableOrders = activeOrders.filter((o) => o.tableNumber === tableNumber)
                      const hasUrgent = tableOrders.some((o) => getOrderPriority(o) === "urgent")
                      const status = tableOrders[0]?.status

                      return (
                        <div key={tableNumber} className="flex justify-between items-center">
                          <span className="text-foreground">Table {tableNumber}</span>
                          <div className="flex items-center gap-2">
                            {hasUrgent && <AlertTriangle className="w-4 h-4 text-destructive" />}
                            <Badge variant={status === "pending" ? "destructive" : "default"}>{status}</Badge>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {sortedOrders.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-muted rounded-full">
                <ChefHat className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">All caught up!</h3>
                <p className="text-sm text-muted-foreground">No active orders in the kitchen right now.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
