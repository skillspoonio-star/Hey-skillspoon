"use client"

import { useState, useCallback, useEffect } from "react"
import { realTimeSync } from "@/lib/real-time-sync"

export interface OrderItem {
  name: string
  quantity: number
  price: number
  category?: string
  specialInstructions?: string
}

export interface Order {
  id: number
  tableNumber: number
  items: OrderItem[]
  total: number
  status: "pending" | "preparing" | "ready" | "served"
  timestamp: Date
  customerPhone?: string
  customerName?: string
  estimatedTime?: number
  priority?: "low" | "medium" | "high"
  paymentStatus?: "pending" | "paid" | "failed"
  orderType?: "dine-in" | "takeaway" | "delivery"
}

export interface Analytics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  popularItems: Array<{ name: string; count: number }>
  peakHours: Array<{ hour: number; orders: number }>
}

export function useOrderManager() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      tableNumber: 12,
      items: [
        { name: "Chicken Biryani", quantity: 2, price: 350 },
        { name: "Dal Makhani", quantity: 1, price: 280 },
        { name: "Butter Naan", quantity: 3, price: 60 },
      ],
      total: 1160,
      status: "pending",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      customerPhone: "+91 98765 43210",
      customerName: "Rahul Sharma",
      estimatedTime: 25,
      priority: "high",
      paymentStatus: "paid",
      orderType: "dine-in",
    },
    {
      id: 2,
      tableNumber: 8,
      items: [
        { name: "Paneer Tikka", quantity: 1, price: 320 },
        { name: "Mango Lassi", quantity: 2, price: 120 },
      ],
      total: 560,
      status: "preparing",
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      customerPhone: "+91 87654 32109",
      customerName: "Priya Singh",
      estimatedTime: 15,
      priority: "medium",
      paymentStatus: "paid",
      orderType: "dine-in",
    },
    {
      id: 3,
      tableNumber: 5,
      items: [{ name: "Gulab Jamun", quantity: 4, price: 80 }],
      total: 320,
      status: "ready",
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      customerPhone: "+91 76543 21098",
      customerName: "Amit Kumar",
      estimatedTime: 5,
      priority: "low",
      paymentStatus: "paid",
      orderType: "dine-in",
    },
  ])

  useEffect(() => {
    const unsubscribe = realTimeSync.onDashboardUpdate((newOrders) => {
      newOrders.forEach((newOrder) => {
        const order: Order = {
          id: newOrder.id,
          tableNumber: newOrder.tableNumber,
          items: newOrder.items.map((item: any) => ({
            name: item.item || item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: newOrder.total,
          status: "pending",
          timestamp: new Date(newOrder.timestamp),
          customerPhone: newOrder.customerPhone,
          estimatedTime: 20,
          priority: "medium",
          paymentStatus: "pending",
          orderType: "dine-in",
        }

        setOrders((prev) => {
          const exists = prev.find((o) => o.id === order.id)
          if (!exists) {
            return [order, ...prev]
          }
          return prev
        })
      })
    })

    return unsubscribe
  }, [])

  const addOrder = useCallback((tableNumber: number, items: any[]) => {
    const orderItems: OrderItem[] = items.map((item) => ({
      name: item.item || item.name,
      quantity: item.quantity,
      price: item.price,
    }))

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const order: Order = {
      id: Date.now(),
      tableNumber,
      items: orderItems,
      total,
      status: "pending",
      timestamp: new Date(),
      estimatedTime: 20,
      priority: "medium",
      paymentStatus: "pending",
      orderType: "dine-in",
    }

    setOrders((prev) => [order, ...prev])
    return order
  }, [])

  const updateOrderStatus = useCallback(
    (orderId: number, newStatus: Order["status"]) => {
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

      const order = orders.find((o) => o.id === orderId)
      if (order) {
        realTimeSync.emitOrderUpdate({
          id: orderId,
          status: newStatus,
          timestamp: new Date(),
          tableNumber: order.tableNumber,
          customerPhone: order.customerPhone,
        })
      }
    },
    [orders],
  )

  const updateOrder = useCallback((orderId: number, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order)))
  }, [])

  const deleteOrder = useCallback((orderId: number) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
  }, [])

  const getOrdersByStatus = useCallback(
    (status: Order["status"]) => {
      return orders.filter((order) => order.status === status)
    },
    [orders],
  )

  const getOrdersByTable = useCallback(
    (tableNumber: number) => {
      return orders.filter((order) => order.tableNumber === tableNumber)
    },
    [orders],
  )

  const getOrdersByPriority = useCallback(
    (priority: Order["priority"]) => {
      return orders.filter((order) => order.priority === priority)
    },
    [orders],
  )

  const getAnalytics = useCallback((): Analytics => {
    const totalRevenue = orders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.total, 0)

    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate popular items
    const itemCounts: Record<string, number> = {}
    orders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
      })
    })

    const popularItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate peak hours (mock data for now)
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: Math.floor(Math.random() * 20) + 1,
    }))

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      popularItems,
      peakHours,
    }
  }, [orders])

  const searchOrders = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase()
      return orders.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(lowercaseQuery) ||
          order.customerPhone?.includes(query) ||
          order.tableNumber.toString().includes(query) ||
          order.items.some((item) => item.name.toLowerCase().includes(lowercaseQuery)),
      )
    },
    [orders],
  )

  // Auto-update order priorities based on time
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          const minutesElapsed = Math.floor((Date.now() - order.timestamp.getTime()) / (1000 * 60))
          let priority: Order["priority"] = "low"

          if (minutesElapsed > 30) priority = "high"
          else if (minutesElapsed > 15) priority = "medium"

          return { ...order, priority }
        }),
      )
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return {
    orders,
    addOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    getOrdersByStatus,
    getOrdersByTable,
    getOrdersByPriority,
    getAnalytics,
    searchOrders,
  }
}
