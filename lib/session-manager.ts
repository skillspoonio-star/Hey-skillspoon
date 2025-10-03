"use client"

export interface SessionOrder {
  id: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: "pending" | "preparing" | "ready" | "served"
  timestamp: Date
}

export interface TableSession {
  sessionId: string
  tableNumber: number
  customerName: string
  guestCount: number
  startTime: Date
  orders: SessionOrder[]
  totalAmount: number
  status: "active" | "payment_requested" | "completed"
  phoneNumber?: string
}

class SessionManager {
  private readonly STORAGE_KEY = "table_sessions"
  private listeners: Map<number, Array<(session: TableSession | null) => void>> = new Map()

  // Create a new session when table is assigned
  createSession(tableNumber: number, customerName: string, guestCount: number): TableSession {
    const sessionId = `T${tableNumber}-${Date.now().toString(36).toUpperCase()}`

    const newSession: TableSession = {
      sessionId,
      tableNumber,
      customerName,
      guestCount,
      startTime: new Date(),
      orders: [],
      totalAmount: 0,
      status: "active",
    }

    this.saveSession(newSession)
    this.notifyListeners(tableNumber, newSession)

    return newSession
  }

  // Get active session for a table
  getSession(tableNumber: number): TableSession | null {
    const sessions = this.getAllSessions()
    return sessions.find((s) => s.tableNumber === tableNumber && s.status !== "completed") || null
  }

  // Add order to existing session
  addOrderToSession(
    tableNumber: number,
    items: Array<{ name: string; quantity: number; price: number }>,
  ): SessionOrder | null {
    const session = this.getSession(tableNumber)
    if (!session) return null

    const orderTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const newOrder: SessionOrder = {
      id: `ORD-${Date.now()}`,
      items,
      total: orderTotal,
      status: "pending",
      timestamp: new Date(),
    }

    session.orders.push(newOrder)
    session.totalAmount += orderTotal

    this.saveSession(session)
    this.notifyListeners(tableNumber, session)

    return newOrder
  }

  // Update order status
  updateOrderStatus(tableNumber: number, orderId: string, status: SessionOrder["status"]): void {
    const session = this.getSession(tableNumber)
    if (!session) return

    const order = session.orders.find((o) => o.id === orderId)
    if (order) {
      order.status = status
      this.saveSession(session)
      this.notifyListeners(tableNumber, session)
    }
  }

  // Request payment (generate bill)
  requestPayment(tableNumber: number, phoneNumber?: string): TableSession | null {
    const session = this.getSession(tableNumber)
    if (!session) return null

    session.status = "payment_requested"
    if (phoneNumber) {
      session.phoneNumber = phoneNumber
    }

    this.saveSession(session)
    this.notifyListeners(tableNumber, session)

    return session
  }

  updateSessionPhone(tableNumber: number, phoneNumber: string): void {
    const session = this.getSession(tableNumber)
    if (!session) return

    session.phoneNumber = phoneNumber
    this.saveSession(session)
    this.notifyListeners(tableNumber, session)
  }

  // Complete session (after payment)
  completeSession(tableNumber: number): void {
    const session = this.getSession(tableNumber)
    if (!session) return

    session.status = "completed"
    this.saveSession(session)
    this.notifyListeners(tableNumber, null)
  }

  // End session (clear table)
  endSession(tableNumber: number): void {
    const sessions = this.getAllSessions()
    const updatedSessions = sessions.filter((s) => s.tableNumber !== tableNumber || s.status === "completed")
    this.saveSessions(updatedSessions)
    this.notifyListeners(tableNumber, null)
  }

  // Get all sessions
  getAllSessions(): TableSession[] {
    if (typeof window === "undefined") return []

    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []

      const sessions = JSON.parse(data)
      // Convert date strings back to Date objects
      return sessions.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        orders: s.orders.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp),
        })),
      }))
    } catch (error) {
      console.error("[SessionManager] Error loading sessions:", error)
      return []
    }
  }

  // Get active sessions only
  getActiveSessions(): TableSession[] {
    return this.getAllSessions().filter((s) => s.status !== "completed")
  }

  // Subscribe to session updates for a specific table
  subscribe(tableNumber: number, callback: (session: TableSession | null) => void) {
    if (!this.listeners.has(tableNumber)) {
      this.listeners.set(tableNumber, [])
    }
    this.listeners.get(tableNumber)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(tableNumber)
      if (callbacks) {
        this.listeners.set(
          tableNumber,
          callbacks.filter((cb) => cb !== callback),
        )
      }
    }
  }

  // Private helper methods
  private saveSession(session: TableSession): void {
    const sessions = this.getAllSessions()
    const index = sessions.findIndex((s) => s.sessionId === session.sessionId)

    if (index >= 0) {
      sessions[index] = session
    } else {
      sessions.push(session)
    }

    this.saveSessions(sessions)
  }

  private saveSessions(sessions: TableSession[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error("[SessionManager] Error saving sessions:", error)
    }
  }

  private notifyListeners(tableNumber: number, session: TableSession | null): void {
    const callbacks = this.listeners.get(tableNumber)
    if (callbacks) {
      callbacks.forEach((callback) => callback(session))
    }
  }

  // Get session statistics
  getSessionStats(tableNumber: number): {
    orderCount: number
    totalAmount: number
    duration: string
  } | null {
    const session = this.getSession(tableNumber)
    if (!session) return null

    const duration = this.formatDuration(new Date().getTime() - new Date(session.startTime).getTime())

    return {
      orderCount: session.orders.length,
      totalAmount: session.totalAmount,
      duration,
    }
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }
}

// Create singleton instance
export const sessionManager = new SessionManager()
