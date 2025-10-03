"use client"

interface OrderItem {
  id: number
  item: string
  quantity: number
  price: number
}

interface Order {
  id: number
  tableNumber: number
  items: OrderItem[]
  total: number
  status: "pending" | "preparing" | "ready" | "served"
  timestamp: Date
  customerPhone?: string
}

class OrderManager {
  private orders: Order[] = []
  private listeners: Array<(orders: Order[]) => void> = []

  // Subscribe to order updates
  subscribe(callback: (orders: Order[]) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach((listener) => listener([...this.orders]))
  }

  // Add new order from voice interface
  addOrder(tableNumber: number, items: OrderItem[], customerPhone?: string) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const newOrder: Order = {
      id: Date.now(),
      tableNumber,
      items,
      total,
      status: "pending",
      timestamp: new Date(),
      customerPhone,
    }

    this.orders.push(newOrder)
    this.notify()

    // Simulate sending to restaurant dashboard
    this.sendToRestaurant(newOrder)

    return newOrder
  }

  // Update order status (from restaurant dashboard)
  updateOrderStatus(orderId: number, status: Order["status"]) {
    const orderIndex = this.orders.findIndex((order) => order.id === orderId)
    if (orderIndex !== -1) {
      this.orders[orderIndex].status = status
      this.notify()

      // Send notification to customer
      this.notifyCustomer(this.orders[orderIndex])
    }
  }

  // Get all orders
  getOrders(): Order[] {
    return [...this.orders]
  }

  // Get orders by table
  getOrdersByTable(tableNumber: number): Order[] {
    return this.orders.filter((order) => order.tableNumber === tableNumber)
  }

  // Get orders by status
  getOrdersByStatus(status: Order["status"]): Order[] {
    return this.orders.filter((order) => order.status === status)
  }

  // Simulate sending order to restaurant dashboard
  private sendToRestaurant(order: Order) {
    console.log(`[Order Manager] New order sent to restaurant dashboard:`, order)

    // In a real app, this would be an API call to the restaurant system
    // fetch('/api/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(order)
    // })
  }

  // Simulate customer notification
  private notifyCustomer(order: Order) {
    console.log(`[Order Manager] Customer notification for Table ${order.tableNumber}:`, {
      status: order.status,
      message: this.getStatusMessage(order.status),
    })

    // In a real app, this would send SMS or push notification
    // if (order.customerPhone) {
    //   sendSMS(order.customerPhone, this.getStatusMessage(order.status))
    // }
  }

  private getStatusMessage(status: Order["status"]): string {
    switch (status) {
      case "pending":
        return "Your order has been received and is being reviewed."
      case "preparing":
        return "Your order is being prepared by our kitchen team."
      case "ready":
        return "Your order is ready! Please wait for our staff to serve you."
      case "served":
        return "Your order has been served. Enjoy your meal!"
      default:
        return "Order status updated."
    }
  }

  // Clear completed orders (cleanup)
  clearServedOrders() {
    this.orders = this.orders.filter((order) => order.status !== "served")
    this.notify()
  }

  // Get analytics data
  getAnalytics() {
    const totalRevenue = this.orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = this.orders.length
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    const statusCounts = this.orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const popularItems = this.orders.reduce(
      (acc, order) => {
        order.items.forEach((item) => {
          acc[item.item] = (acc[item.item] || 0) + item.quantity
        })
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      statusCounts,
      popularItems: Object.entries(popularItems)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    }
  }
}

// Create singleton instance
export const orderManager = new OrderManager()

// Export types
export type { Order, OrderItem }
