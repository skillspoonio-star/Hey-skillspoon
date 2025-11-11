"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { VoiceInterface } from "@/components/voice-interface"
import { MenuBrowser } from "@/components/menu-browser"
import { OrderSummary } from "@/components/order-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Menu, ShoppingCart, Mic, Bell, X } from "lucide-react"
import { realTimeSync } from "@/lib/real-time-sync"
import { sessionManager, type TableSession } from "@/lib/session-manager"

export default function TablePage() {
  const params = useParams()
  const tableId = params.id as string
  const tableNumber = Number.parseInt(tableId)

  const [currentView, setCurrentView] = useState<"voice" | "menu" | "order">("voice")
  const [currentOrder, setCurrentOrder] = useState<any[]>([]) // Current order being built
  const [session, setSession] = useState<TableSession | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  
  useEffect(() => {
    if (tableNumber && !isNaN(tableNumber)) {
      const loadServerSession = async () => {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        try {
          const res = await fetch(`${base}/api/sessions/table/${tableNumber}`)
          if (res.ok) {
            const s = await res.json()
            // normalize server session shape to TableSession interface roughly
            setSession({
              sessionId: s.sessionId,
              tableNumber: s.tableNumber,
              customerName: s.customerName,
              guestCount: s.guestCount || 0,
              startTime: new Date(s.createdAt || Date.now()),
              orders: (s.orders || []).map((o: any) => ({ id: o._id?.toString() || '', items: (o.items || []).map((it: any) => ({ name: it.name, quantity: it.quantity, price: it.price })), total: o.total, status: o.status || 'pending', timestamp: new Date(o.timestamp || o.createdAt || Date.now()) })),
              totalAmount: s.payment?.total || 0,
              status: s.active ? 'active' : 'completed',
              phoneNumber: s.mobile || s.phoneNumber,
            })
            console.log(session);
          } else {
            const loadedSession = sessionManager.getSession(tableNumber)
            setSession(loadedSession)
          }
        } catch (e) {
          const loadedSession = sessionManager.getSession(tableNumber)
          setSession(loadedSession)
        }
      }

      loadServerSession()
      setIsLoading(false)

      const unsubscribe = sessionManager.subscribe(tableNumber, (updatedSession) => {
        setSession(updatedSession)
      })

      return unsubscribe
    } else {
      setIsLoading(false)
    }
  }, [tableNumber])

  // serverAddOrder posts the current items to backend session API
  const serverAddOrder = async (items: { name: string; quantity: number; price: number }[]) => {
    if (!session) throw new Error('No active session')
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
    try {
      const res = await fetch(`${base}/api/sessions/${session.sessionId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total: items.reduce((s, it) => s + it.price * it.quantity, 0) }),
      })
      if (!res.ok) {
        console.error('Failed to add order to session', await res.text())
        return null
      }
      const data = await res.json()
      // update session state with returned session
      const s = data.session
      setSession({
        sessionId: s.sessionId,
        tableNumber: s.tableNumber,
        customerName: s.customerName,
        guestCount: s.guestCount || 0,
        startTime: new Date(s.createdAt || Date.now()),
        orders: (s.orders || []).map((o: any) => ({ id: o._id?.toString() || '', items: (o.items || []).map((it: any) => ({ name: it.name, quantity: it.quantity, price: it.price })), total: o.total, status: o.status || 'pending', timestamp: new Date(o.timestamp || o.createdAt || Date.now()) })),
        totalAmount: s.payment?.total || 0,
        status: s.active ? 'active' : 'completed',
        phoneNumber: s.mobile || s.phoneNumber,
      })

      return data
    } catch (err) {
      console.error('Failed to post order to server', err)
      return null
    }
  }

  // Helper to add an item to currentOrder; if same itemId/name exists, increment quantity
  const addOrIncrementItem = (incoming: any) => {
    const idKey = incoming.itemId ?? incoming.id ?? null
    const nameKey = (incoming.name || incoming.item || '').toString()
    const qty = Number(incoming.quantity || 1)
    const price = Number(incoming.price || 0)

    setCurrentOrder((prev) => {
      // find by itemId first, then by name
      const idx = prev.findIndex((p) => {
        if (idKey != null && (p.itemId === idKey || p.id === idKey)) return true
        const pn = (p.item || p.name || '').toString()
        return pn === nameKey
      })
      if (idx === -1) {
        const normalized = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          item: nameKey,
          name: nameKey,
          itemId: idKey,
          quantity: qty,
          price: price,
        }
        return [...prev, normalized]
      }
      // merge
      return prev.map((p, i) => i === idx ? { ...p, quantity: Number(p.quantity || 0) + qty, price: Number(p.price || price || 0) } : p)
    })
  }

  useEffect(() => {
    if (!session) return

    const unsubscribe = realTimeSync.onCustomerNotification((notification) => {
      if (notification.tableNumber === tableNumber) {
        setNotifications((prev) => [notification.message, ...prev.slice(0, 4)])
        setShowNotification(true)

        setTimeout(() => {
          setShowNotification(false)
        }, 5000)
      }
    })

    return unsubscribe
  }, [session, tableNumber])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4 animate-pulse">
              <span className="text-2xl">🍽️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading Table {tableNumber}...</h2>
            <p className="text-muted-foreground">Please wait while we check your table status.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tableNumber || isNaN(tableNumber) || tableNumber < 1 || tableNumber > 24) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Table</h2>
            <p className="text-muted-foreground mb-4">Table {tableId} is not valid. Please check your table number.</p>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Table {tableNumber} Not Assigned</h2>
            <p className="text-muted-foreground mb-4">
              Please wait for a staff member to assign you to this table before you can start ordering.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <h1 className="font-sans font-bold text-xl text-foreground">Hey Paytm</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotification(!showNotification)}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    {notifications.length}
                  </div>
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">Table {tableNumber}</div>
          </div>
        </div>
      </header>

      {showNotification && notifications.length > 0 && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Order Updates</h4>
                  <div className="space-y-1">
                    {notifications.slice(0, 2).map((notification, index) => (
                      <p key={index} className="text-sm text-blue-800">
                        {notification}
                      </p>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowNotification(false)} className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        {currentView === "voice" && (
          <VoiceInterface
            onOrderUpdate={(newOrder) => addOrIncrementItem(newOrder)}
            orders={currentOrder}
            tableNumber={tableNumber}
          />
        )}

        {currentView === "menu" && (
          <MenuBrowser
            onAddToOrder={(item) => {
              // normalize and merge into currentOrder
              const normalized = {
                id: Date.now(),
                item: item.name || item.item || item.name,
                name: item.name || item.item || item.name,
                itemId: (item as any).itemId || item.id,
                quantity: item.quantity || 1,
                price: Number(item.price || 0),
              }
              addOrIncrementItem(normalized)
              // switch to order view so user sees the added item
              // setCurrentView("order")
            }}
            tableNumber={tableNumber}
            serverAddOrder={serverAddOrder}
            currentOrder={currentOrder}
            onChangeQuantity={(item: any, delta: number) => {
              // increment
              if (delta > 0) {
                const normalized = {
                  id: Date.now(),
                  item: item.name || item.item || item.name,
                  name: item.name || item.item || item.name,
                  itemId: (item as any).itemId || item.id,
                  quantity: delta,
                  price: Number(item.price || 0),
                }
                addOrIncrementItem(normalized)
                return
              }

              // decrement
              setCurrentOrder((prev) => {
                const idx = prev.findIndex((p) => Number(p.itemId) === Number(item.itemId))
                if (idx === -1) return prev
                const currentQty = Number(prev[idx].quantity || 0)
                const newQty = currentQty + delta // delta is negative
                if (newQty <= 0) {
                  return prev.filter((_, i) => i !== idx)
                }
                return prev.map((p, i) => (i === idx ? { ...p, quantity: newQty } : p))
              })
            }}
          />
        )}

        {currentView === "order" && (
          <OrderSummary
            currentOrder={currentOrder}
            onUpdateCurrentOrder={setCurrentOrder}
            session={session}
            tableNumber={tableNumber}
            serverAddOrder={serverAddOrder}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="max-w-md mx-auto flex">
          <Button
            variant={currentView === "voice" ? "default" : "ghost"}
            className="flex-1 rounded-none h-16 flex-col gap-1"
            onClick={() => setCurrentView("voice")}
          >
            <Mic className="w-5 h-5" />
            <span className="text-xs">Voice</span>
          </Button>

          <Button
            variant={currentView === "menu" ? "default" : "ghost"}
            className="flex-1 rounded-none h-16 flex-col gap-1"
            onClick={() => setCurrentView("menu")}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs">Menu</span>
          </Button>

          <Button
            variant={currentView === "order" ? "default" : "ghost"}
            className="flex-1 rounded-none h-16 flex-col gap-1 relative"
            onClick={() => setCurrentView("order")}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs">Order</span>
            {(currentOrder.length > 0 || (session && session.orders.length > 0)) && (
              <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {currentOrder.length }
              </div>
            )}
          </Button>
        </div>
      </nav>
    </div>
  )
}
