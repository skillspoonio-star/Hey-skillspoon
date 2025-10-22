export interface OrderUpdate {
  id: string | number
  status: "pending" | "preparing" | "ready" | "served" | "cancelled"
  timestamp: Date
  tableNumber: number
  customerPhone?: string
}

export interface CustomerNotification {
  orderId: string | number
  message: string
  type: "status_update" | "payment_confirmed" | "order_ready"
  timestamp: Date
  tableNumber: number
}

export interface CashPaymentRequest {
  id: string | number
  tableNumber: number
  customerPhone: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  timestamp: Date
}

class RealTimeSync {
  private orderUpdateCallbacks: ((update: OrderUpdate) => void)[] = []
  private customerNotificationCallbacks: ((notification: CustomerNotification) => void)[] = []
  private dashboardUpdateCallbacks: ((orders: any[]) => void)[] = []
  private cashPaymentRequestCallbacks: ((request: CashPaymentRequest) => void)[] = []

  // Subscribe to order updates (for dashboard)
  onOrderUpdate(callback: (update: OrderUpdate) => void) {
    this.orderUpdateCallbacks.push(callback)
    return () => {
      this.orderUpdateCallbacks = this.orderUpdateCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Subscribe to customer notifications (for user interface)
  onCustomerNotification(callback: (notification: CustomerNotification) => void) {
    this.customerNotificationCallbacks.push(callback)
    return () => {
      this.customerNotificationCallbacks = this.customerNotificationCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Subscribe to dashboard updates (for user interface)
  onDashboardUpdate(callback: (orders: any[]) => void) {
    this.dashboardUpdateCallbacks.push(callback)
    return () => {
      this.dashboardUpdateCallbacks = this.dashboardUpdateCallbacks.filter((cb) => cb !== callback)
    }
  }

  onCashPaymentRequest(callback: (request: CashPaymentRequest) => void) {
    this.cashPaymentRequestCallbacks.push(callback)
    return () => {
      this.cashPaymentRequestCallbacks = this.cashPaymentRequestCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Emit order update from dashboard to customer
  emitOrderUpdate(update: OrderUpdate) {
    this.orderUpdateCallbacks.forEach((callback) => callback(update))

    // Send customer notification
    const notification: CustomerNotification = {
      orderId: update.id,
      message: this.getStatusMessage(update.status),
      type: "status_update",
      timestamp: new Date(),
      tableNumber: update.tableNumber,
    }

    this.customerNotificationCallbacks.forEach((callback) => callback(notification))
  }

  // Emit new order from customer to dashboard
  emitNewOrder(order: any) {
    this.dashboardUpdateCallbacks.forEach((callback) => {
      // In real implementation, this would update the global order state
      callback([order])
    })
  }

  emitCashPaymentRequest(paymentData: Omit<CashPaymentRequest, "id" | "timestamp">) {
    const request: CashPaymentRequest = {
      ...paymentData,
      id: Date.now(),
      timestamp: new Date(),
    }

    this.cashPaymentRequestCallbacks.forEach((callback) => callback(request))
  }

  // Emit payment confirmation
  emitPaymentConfirmation(orderId: string | number, customerPhone: string, tableNumber: number) {
    const notification: CustomerNotification = {
      orderId,
      message: "Payment confirmed! Your order is being prepared.",
      type: "payment_confirmed",
      timestamp: new Date(),
      tableNumber,
    }

    this.customerNotificationCallbacks.forEach((callback) => callback(notification))
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case "pending":
        return "Your order has been received and is pending confirmation."
      case "preparing":
        return "Great! Your order is now being prepared by our kitchen."
      case "ready":
        return "Your order is ready! Please collect it from the counter."
      case "served":
        return "Order completed. Thank you for dining with us!"
      default:
        return "Order status updated."
    }
  }
}

export const realTimeSync = new RealTimeSync()
