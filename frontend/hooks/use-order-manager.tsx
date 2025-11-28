"use client"

import { useState, useCallback, useEffect } from "react"
import { realTimeSync } from "@/lib/real-time-sync"
import { fetchMenuItems, type MenuItem } from "@/lib/menu-data"

export interface OrderItem {
  name: string
  quantity: number
  price: number
  category?: string
  specialInstructions?: string
}

export interface Order {
  id: string | number
  tableNumber: number
  items: OrderItem[]
  total: number
  status: "pending" | "preparing" | "ready" | "served" | "cancelled"
  timestamp: Date
  customerPhone?: string
  customerName?: string
  estimatedTime?: number
  priority?: "low" | "medium" | "high"
  paymentStatus?: "pending" | "paid" | "failed"
  orderType?: "dine-in" | "take-away" | "delivery"
}

export interface Analytics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  popularItems: Array<{ name: string; count: number }>
  peakHours: Array<{ hour: number; orders: number }>
}

export function useOrderManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // load menu items first so we can map itemId -> name/price
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const items = await fetchMenuItems()
        if (!mounted) return
        setMenuItems(items)
      } catch (err) {
        console.error('Failed to load menu items in order manager', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // ✅ Fetch live orders from API on mount (using fetch)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("http://localhost:3001/api/orders/live")
        if (!res.ok) throw new Error("Failed to fetch orders")
        const data = await res.json()

        const formatted = data.map((order: any) => ({
          id: order._id,
          tableNumber: order.tableNumber,
          items: (order.items || []).map((it: any) => {
            const itemId = Number(it.itemId ?? it.id)
            const menu = menuItems.find((m) => Number(m.id) === itemId)
            return {
              name: menu?.name || `Item ${itemId}`,
              quantity: Number(it.quantity || 1),
              price: Number(menu?.price ?? it.price ?? 0),
              category: menu?.category,
              specialInstructions: it.specialInstructions || undefined,
            }
          }),
          total: order.total,
          status: order.status,
          timestamp: new Date(order.timestamp),
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          estimatedTime: order.estimatedTime,
          priority: order.priority,
          paymentStatus: order.paymentStatus,
          orderType: order.orderType,
        }))

        setOrders(formatted)
      } catch (error) {
        console.error("Failed to load live orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [menuItems])

  // ✅ Real-time updates
  useEffect(() => {

    const unsubscribe = realTimeSync.onDashboardUpdate((newOrders) => {
      newOrders.forEach((newOrder) => {
        const mappedItems = (newOrder.items || []).map((it: any) => {
          const itemId = Number(it.itemId ?? it.id)
          const menu = menuItems.find((m) => Number(m.id) === itemId)
          return {
            name: menu?.name || it.name || `Item ${itemId}`,
            quantity: Number(it.quantity || 1),
            price: Number(menu?.price ?? it.price ?? 0),
          }
        })

        const order: Order = {
          id: newOrder.id || newOrder._id,
          tableNumber: newOrder.tableNumber,
          items: mappedItems,
          total: newOrder.total,
          status: newOrder.status || "pending",
          timestamp: new Date(newOrder.timestamp),
          customerPhone: newOrder.customerPhone,
          estimatedTime: newOrder.estimatedTime || 20,
          priority: newOrder.priority || "medium",
          paymentStatus: newOrder.paymentStatus || "pending",
          orderType: newOrder.orderType || "dine-in",
        }

        setOrders((prev) => {
          const exists = prev.find((o) => String(o.id) === String(order.id))
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
      // optimistic local id can be a number; convert to string when comparing with server ids
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

  // ✅ Update order status (using fetch PATCH)
  const updateOrderStatus = useCallback(
    async (orderId: string | number, newStatus: Order["status"]) => {
      try {
        // Update locally first
        setOrders((prev) =>
          prev.map((order) =>
            String(order.id) === String(orderId) ? { ...order, status: newStatus } : order,
          ),
        )

        // PATCH request to backend
        // ensure we pass string id (Mongo _id) to backend
        const res = await fetch(`http://localhost:3001/api/orders/${String(orderId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })

        if (!res.ok) {
          throw new Error(`Failed to update order status: ${res.status}`)
        }

        // Emit real-time update
        const order = orders.find((o) => String(o.id) === String(orderId))
        if (order) {
          // normalize id to string so real-time subscribers receive a stable id shape
          realTimeSync.emitOrderUpdate({
            id: String(orderId),
            status: newStatus,
            timestamp: new Date(),
            tableNumber: order.tableNumber,
            customerPhone: order.customerPhone,
          })
        }
      } catch (err) {
        console.error("Failed to update order status:", err)
      }
    },
    [orders],
  )

  const updateOrder = useCallback(
    async (orderId: number | string, updates: Partial<Order>) => {
      try {
        // Call backend PATCH to update the order
        const res = await fetch(`http://localhost:3001/api/orders/${String(orderId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        if (!res.ok) {
          // don't throw for client-side UX; log and return
          console.error("Failed to patch order", res.status)
          return
        }

        const updated = await res.json()

        // normalized updated object -> map to local Order shape
        const formatted: Partial<Order> = {
          id: updated._id || updated.id,
          tableNumber: typeof updated.tableNumber !== "undefined" ? updated.tableNumber : undefined,
          total: typeof updated.total !== "undefined" ? updated.total : undefined,
          status: typeof updated.status !== "undefined" ? updated.status : undefined,
          timestamp: updated.timestamp ? new Date(updated.timestamp) : undefined,
          customerPhone: updated.customerPhone,
          customerName: updated.customerName,
          estimatedTime: typeof updated.estimatedTime !== "undefined" ? updated.estimatedTime : undefined,
          priority: updated.priority,
          paymentStatus: updated.paymentStatus,
          orderType: updated.orderType,
        }

        // Handle items: if backend returned items with name/price use them; otherwise try to preserve local names/prices
        if (Array.isArray(updated.items)) {
          const mappedItems = updated.items.map((it: any) => {
            const itemId = Number(it.itemId ?? it.id)
            const menu = menuItems.find((m) => Number(m.id) === itemId)
            return {
              name: menu?.name || it.name || `Item ${itemId}`,
              quantity: Number(it.quantity || 1),
              price: Number(menu?.price ?? it.price ?? 0),
            }
          })

          formatted.items = mappedItems as any
        }

        // Replace local order with updated data
        setOrders((prev) =>
          prev.map((order) => (String(order.id) === String(orderId) ? { ...order, ...formatted } as Order : order)),
        )
      } catch (err) {
        console.error("updateOrder failed", err)
      }
    },
    [orders],
  )

  const deleteOrder = useCallback((orderId: number | string) => {
    setOrders((prev) => prev.filter((order) => String(order.id) !== String(orderId)))
  }, [])

  const getOrdersByStatus = useCallback(
    (status: Order["status"]) => orders.filter((order) => order.status === status),
    [orders],
  )

  const getOrdersByTable = useCallback(
    (tableNumber: number) => orders.filter((order) => order.tableNumber === tableNumber),
    [orders],
  )

  const getOrdersByPriority = useCallback(
    (priority: Order["priority"]) => orders.filter((order) => order.priority === priority),
    [orders],
  )

  const getAnalytics = useCallback((): Analytics => {
    const totalRevenue = orders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.total, 0)

    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

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

  // Auto-update priorities based on time elapsed
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          const minutesElapsed = Math.floor(
            (Date.now() - order.timestamp.getTime()) / (1000 * 60),
          )
          let priority: Order["priority"] = "low"
          if (minutesElapsed > 30) priority = "high"
          else if (minutesElapsed > 15) priority = "medium"
          return { ...order, priority }
        }),
      )
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return {
    orders,
    isLoading,
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
