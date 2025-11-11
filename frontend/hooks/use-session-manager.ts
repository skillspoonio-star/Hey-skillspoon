"use client"

import { useState, useCallback, useEffect } from "react"
import { realTimeSync } from "@/lib/real-time-sync"

export interface SessionOrder {
  id: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  timestamp: Date
  status: "pending" | "preparing" | "ready" | "served"
}

export interface TableSession {
  sessionId: string
  tableNumber: number
  customerName: string
  guestCount: number
  startTime: Date
  orders: SessionOrder[]
  totalAmount: number
  status: "active" | "billing" | "completed"
  phoneNumber?: string
}

export function useSessionManager() {
  const [sessions, setSessions] = useState<TableSession[]>([])

  // Create a new session when table is assigned
  const createSession = useCallback((tableNumber: number, customerName: string, guestCount: number) => {
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

    setSessions((prev) => [...prev, newSession])

    // Store in localStorage for persistence
    localStorage.setItem(`session_${tableNumber}`, JSON.stringify(newSession))

    return newSession
  }, [])

  // Add order to existing session
  const addOrderToSession = useCallback((tableNumber: number, items: any[]) => {
    const order: SessionOrder = {
      id: Date.now(),
      items: items.map((item) => ({
        name: item.item || item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      timestamp: new Date(),
      status: "pending",
    }

    setSessions((prev) =>
      prev.map((session) => {
        if (session.tableNumber === tableNumber && session.status === "active") {
          const updatedOrders = [...session.orders, order]
          const updatedSession = {
            ...session,
            orders: updatedOrders,
            totalAmount: updatedOrders.reduce((sum, o) => sum + o.total, 0),
          }

          // Update localStorage
          localStorage.setItem(`session_${tableNumber}`, JSON.stringify(updatedSession))

          // Emit to dashboard for live updates
          realTimeSync.emitNewOrder({
            id: order.id,
            tableNumber,
            items: order.items,
            total: order.total,
            timestamp: order.timestamp,
            customerName: session.customerName,
            sessionId: session.sessionId,
          })

          return updatedSession
        }
        return session
      }),
    )

    return order
  }, [])

  // Get session by table number
  const getSessionByTable = useCallback(
    (tableNumber: number) => {
      return sessions.find((s) => s.tableNumber === tableNumber && s.status === "active")
    },
    [sessions],
  )

  // Update session status
  const updateSessionStatus = useCallback((tableNumber: number, status: TableSession["status"]) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.tableNumber === tableNumber) {
          const updatedSession = { ...session, status }
          localStorage.setItem(`session_${tableNumber}`, JSON.stringify(updatedSession))
          return updatedSession
        }
        return session
      }),
    )
  }, [])

  // Add phone number to session for billing
  const addPhoneToSession = useCallback((tableNumber: number, phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new Error('Phone number must be exactly 10 digits');
    }
    
    setSessions((prev) =>
      prev.map((session) => {
        if (session.tableNumber === tableNumber) {
          const updatedSession = { ...session, phoneNumber: cleanPhone, status: "billing" as const }
          localStorage.setItem(`session_${tableNumber}`, JSON.stringify(updatedSession))
          return updatedSession
        }
        return session
      }),
    )
  }, [])

  // End session and clear data
  const endSession = useCallback((tableNumber: number) => {
    setSessions((prev) => prev.filter((session) => session.tableNumber !== tableNumber))
    localStorage.removeItem(`session_${tableNumber}`)
  }, [])

  // Load sessions from localStorage on mount
  useEffect(() => {
    const loadedSessions: TableSession[] = []

    for (let i = 1; i <= 24; i++) {
      const sessionData = localStorage.getItem(`session_${i}`)
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData)
          // Convert date strings back to Date objects
          session.startTime = new Date(session.startTime)
          session.orders = session.orders.map((order: any) => ({
            ...order,
            timestamp: new Date(order.timestamp),
          }))
          loadedSessions.push(session)
        } catch (error) {
          console.error(`Error loading session for table ${i}:`, error)
        }
      }
    }

    if (loadedSessions.length > 0) {
      setSessions(loadedSessions)
    }
  }, [])

  return {
    sessions,
    createSession,
    addOrderToSession,
    getSessionByTable,
    updateSessionStatus,
    addPhoneToSession,
    endSession,
  }
}
