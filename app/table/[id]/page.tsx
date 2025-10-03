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
      const loadedSession = sessionManager.getSession(tableNumber)
      setSession(loadedSession)
      setIsLoading(false)

      const unsubscribe = sessionManager.subscribe(tableNumber, (updatedSession) => {
        setSession(updatedSession)
      })

      return unsubscribe
    } else {
      setIsLoading(false)
    }
  }, [tableNumber])

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
            onOrderUpdate={(newOrder) => setCurrentOrder((prev) => [...prev, newOrder])}
            orders={currentOrder}
            tableNumber={tableNumber}
          />
        )}

        {currentView === "menu" && (
          <MenuBrowser onAddToOrder={(item) => setCurrentOrder((prev) => [...prev, item])} tableNumber={tableNumber} />
        )}

        {currentView === "order" && (
          <OrderSummary
            currentOrder={currentOrder}
            onUpdateCurrentOrder={setCurrentOrder}
            session={session}
            tableNumber={tableNumber}
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
                {currentOrder.length + (session?.orders.length || 0)}
              </div>
            )}
          </Button>
        </div>
      </nav>
    </div>
  )
}
