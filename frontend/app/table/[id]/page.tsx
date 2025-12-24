"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { VoiceInterface } from "@/components/voice-interface"
import { MenuBrowser } from "@/components/menu-browser"
import { OrderSummary } from "@/components/order-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu, ShoppingCart, Mic, Bell, X } from "lucide-react"
import { realTimeSync } from "@/lib/real-time-sync"
import { sessionManager, type TableSession } from "@/lib/session-manager"
import { useToast } from "@/components/providers/toast-provider"

export default function TablePage() {
  const { success, error, warning } = useToast()
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
  const serverAddOrder = async (items: { itemId?: number; name?: string; quantity: number; price: number }[]) => {
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
    const handleStartSession = async () => {
      setIsLoading(true)
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableNumber,
            customerName: 'Guest',
            guestCount: 1,
          }),
        })

        if (res.ok) {
          const newSession = await res.json()
          setSession({
            sessionId: newSession.sessionId,
            tableNumber: newSession.tableNumber,
            customerName: newSession.customerName,
            guestCount: newSession.guestCount || 1,
            startTime: new Date(newSession.createdAt || Date.now()),
            orders: [],
            totalAmount: 0,
            status: 'active',
            phoneNumber: newSession.mobile || '',
          })
          success("Session started successfully!", "Welcome")
        } else {
          error('Failed to start session. Please try again.', 'Session Error')
        }
      } catch (sessionError) {
        console.error('Error starting session:', sessionError)
        error('Failed to start session. Please try again.', 'Session Error')
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto border-2 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <span className="text-4xl">🍽️</span>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Welcome to Table {tableNumber}!
            </h2>
            <p className="text-muted-foreground mb-6 text-lg">
              Ready to start your dining experience? Let's get you set up!
            </p>

            <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3 text-orange-900 dark:text-orange-400">What you can do:</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                    <Mic className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Voice Ordering</p>
                    <p className="text-xs text-muted-foreground">Order using your voice - just speak naturally!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                    <Menu className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Browse Menu</p>
                    <p className="text-xs text-muted-foreground">Explore our delicious offerings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Track Orders</p>
                    <p className="text-xs text-muted-foreground">See your order status in real-time</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg mb-3"
              onClick={handleStartSession}
              disabled={isLoading}
            >
              {isLoading ? 'Starting Session...' : '🚀 Start Ordering'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background md:pb-0 pb-20">
      {/* Header */}
      <header className="bg-card border-b py-6 px-4 shadow-sm">
        <div className="max-w-md md:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="font-sans font-bold text-xl">Hey Paytm</h1>
                <p className="text-xs text-muted-foreground">Voice Dining Experience</p>
              </div>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotification(!showNotification)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center animate-pulse shadow-lg">
                    {notifications.length}
                  </div>
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Table {tableNumber}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Session: {session?.sessionId?.slice(0, 8) || 'Active'}
            </div>
          </div>
        </div>
      </header>

      {showNotification && notifications.length > 0 && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-top duration-300">
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Order Updates</h4>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 2).map((notification, index) => (
                      <p key={index} className="text-sm text-blue-800 dark:text-blue-200 bg-white/50 dark:bg-black/20 p-2 rounded">
                        {notification}
                      </p>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotification(false)}
                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Desktop View - Hidden on Mobile */}
      <div className="hidden md:block max-w-4xl mx-auto p-6">
        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Ordering
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Browse Menu
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2 relative">
              <ShoppingCart className="w-4 h-4" />
              My Order
              {(currentOrder.length > 0 || (session && session.orders.length > 0)) && (
                <span className="ml-1 bg-orange-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {currentOrder.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice">
            <VoiceInterface
              onOrderUpdate={(newOrder) => addOrIncrementItem(newOrder)}
              orders={currentOrder}
              tableNumber={tableNumber}
              serverAddOrder={serverAddOrder}
            />
          </TabsContent>

          <TabsContent value="menu">
            <MenuBrowser
              onAddToOrder={(item) => {
                const normalized = {
                  id: Date.now(),
                  item: item.name || item.item || item.name,
                  name: item.name || item.item || item.name,
                  itemId: (item as any).itemId || item.id,
                  quantity: item.quantity || 1,
                  price: Number(item.price || 0),
                }
                addOrIncrementItem(normalized)
              }}
              tableNumber={tableNumber}
              serverAddOrder={serverAddOrder}
              currentOrder={currentOrder}
              onChangeQuantity={(item: any, delta: number) => {
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

                setCurrentOrder((prev) => {
                  const idx = prev.findIndex((p) => Number(p.itemId) === Number(item.itemId))
                  if (idx === -1) return prev
                  const currentQty = Number(prev[idx].quantity || 0)
                  const newQty = currentQty + delta
                  if (newQty <= 0) {
                    return prev.filter((_, i) => i !== idx)
                  }
                  return prev.map((p, i) => (i === idx ? { ...p, quantity: newQty } : p))
                })
              }}
            />
          </TabsContent>

          <TabsContent value="order">
            <OrderSummary
              currentOrder={currentOrder}
              onUpdateCurrentOrder={setCurrentOrder}
              session={session}
              tableNumber={tableNumber}
              serverAddOrder={serverAddOrder}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile View - Hidden on Desktop */}
      <main className="md:hidden max-w-md mx-auto p-4 pb-20">
        {currentView === "voice" && (
          <VoiceInterface
            onOrderUpdate={(newOrder) => addOrIncrementItem(newOrder)}
            orders={currentOrder}
            tableNumber={tableNumber}
            serverAddOrder={serverAddOrder}
          />
        )}

        {currentView === "menu" && (
          <MenuBrowser
            onAddToOrder={(item) => {
              const normalized = {
                id: Date.now(),
                item: item.name || item.item || item.name,
                name: item.name || item.item || item.name,
                itemId: (item as any).itemId || item.id,
                quantity: item.quantity || 1,
                price: Number(item.price || 0),
              }
              addOrIncrementItem(normalized)
            }}
            tableNumber={tableNumber}
            serverAddOrder={serverAddOrder}
            currentOrder={currentOrder}
            onChangeQuantity={(item: any, delta: number) => {
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

              setCurrentOrder((prev) => {
                const idx = prev.findIndex((p) => Number(p.itemId) === Number(item.itemId))
                if (idx === -1) return prev
                const currentQty = Number(prev[idx].quantity || 0)
                const newQty = currentQty + delta
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

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40">
        <div className="max-w-md mx-auto flex">
          <Button
            variant="ghost"
            className={`flex-1 rounded-none h-16 flex-col gap-1 transition-all ${currentView === "voice"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            onClick={() => setCurrentView("voice")}
          >
            <Mic className="w-5 h-5" />
            <span className="text-xs font-medium">Voice</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-1 rounded-none h-16 flex-col gap-1 transition-all ${currentView === "menu"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            onClick={() => setCurrentView("menu")}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">Menu</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-1 rounded-none h-16 flex-col gap-1 relative transition-all ${currentView === "order"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            onClick={() => setCurrentView("order")}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs font-medium">Order</span>
            {(currentOrder.length > 0 || (session && session.orders.length > 0)) && (
              <div className="absolute top-2 right-4 bg-orange-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold shadow-lg">
                {currentOrder.length}
              </div>
            )}
          </Button>
        </div>
      </nav>
    </div>
  )
}
