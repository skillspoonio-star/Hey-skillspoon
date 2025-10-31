"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Minus, Trash2, IndianRupee, CheckCircle, AlertTriangle, QrCode, Receipt } from "lucide-react"
import { realTimeSync } from "@/lib/real-time-sync"
import { fetchMenuItems } from "@/lib/menu-data"
import { sessionManager, type TableSession } from "@/lib/session-manager"

type Line = {
  id?: number
  item?: string
  name?: string
  quantity: number
  price: number
}

export function OrderSummary({
  currentOrder,
  onUpdateCurrentOrder,
  session,
  tableNumber,
  serverAddOrder,
}: {
  currentOrder: Line[]
  onUpdateCurrentOrder: (next: Line[]) => void
  session: TableSession | null
  tableNumber: number
  serverAddOrder?: (items: { name: string; quantity: number; price: number }[]) => Promise<{ orderId: any; session: any } | null>
}) {
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showBillView, setShowBillView] = useState(false)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState("")

  const currentSubtotal = useMemo(() => currentOrder.reduce((s, l) => s + l.price * l.quantity, 0), [currentOrder])

  const previousOrders = useMemo(() => session?.orders || [], [session])
  const [expandedPreviousOrders, setExpandedPreviousOrders] = useState<any[] | null>(null)

  // Provide a synchronous view of previous orders while async expansion is pending.
  const renderPreviousOrders = useMemo(() => {
    if (expandedPreviousOrders !== null) return expandedPreviousOrders
    // fallback: derive item names/prices from order.total and item quantities when possible
    return (previousOrders || []).map((o: any) => {
      const total = Number(o.total || o.subtotal || 0)
      const totalQty = (o.items || []).reduce((s: number, it: any) => s + Number(it.quantity || 0), 0) || 0
      const fallbackUnit = totalQty > 0 ? Math.round(total / totalQty) : 0
      return {
        ...o,
        items: (o.items || []).map((it: any) => ({
          name: it.name || `item-${it.itemId}`,
          quantity: Number(it.quantity || 0),
          price: typeof it.price !== 'undefined' && it.price !== null ? Number(it.price) : fallbackUnit,
        })),
      }
    })
  }, [expandedPreviousOrders, previousOrders])

  // Expand previousOrders' item ids into { name, price, quantity } using menu data so UI shows correct prices
  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!previousOrders || previousOrders.length === 0) {
        if (mounted) setExpandedPreviousOrders([])
        return
      }
      try {
        console.log(session?.orders);
        // collect all itemIds
        const ids = new Set<number>()
        for (const o of previousOrders) {
          for (const it of o.items || []) {
            const ai = it as any
            if (typeof ai.itemId !== 'undefined') ids.add(Number(ai.itemId))
          }
        }
        if (ids.size === 0) {
          // nothing to expand
          if (mounted) setExpandedPreviousOrders(previousOrders as any)
          return
        }
        const menu = await fetchMenuItems()
        const menuById = new Map(menu.map((m: any) => [Number(m.id), m]))
        const expanded = (previousOrders || []).map((o: any) => {
          // compute fallback unit price from order total if menu price not available
          const orderTotal = Number(o.total || o.subtotal || 0)
          const totalQty = (o.items || []).reduce((s: number, it: any) => s + Number(it.quantity || 0), 0) || 0
          const fallbackUnit = totalQty > 0 ? Math.round(orderTotal / totalQty) : 0

          return {
            ...o,
            items: (o.items || []).map((it: any) => {
              const ai = it as any
              const mi = menuById.get(Number(ai.itemId))
              const unitPrice = mi ? Number(mi.price) : (typeof ai.price !== 'undefined' && ai.price !== null ? Number(ai.price) : fallbackUnit)
              return {
                name: mi ? mi.name : (ai.name || `item-${ai.itemId}`),
                price: Number.isFinite(unitPrice) ? unitPrice : 0,
                quantity: Number(ai.quantity || 0),
              }
            }),
          }
        })
        if (mounted) setExpandedPreviousOrders(expanded)
      } catch (e) {
        console.warn('Failed to fetch menu items for previous orders expansion', e)
        if (mounted) setExpandedPreviousOrders(previousOrders as any)
      }
    }
    load()
    return () => { mounted = false }
  }, [previousOrders])

  const sessionTotal = useMemo(() => session?.totalAmount || 0, [session])

  const grandTotal = sessionTotal + currentSubtotal

  // we store purchased names for lightweight client telemetry; ids require a menu lookup
  const purchasedIds: number[] = []

  const purchasedNames = useMemo(() => {
    const allOrders = [...previousOrders.flatMap((o) => o.items), ...currentOrder]
    const names = (allOrders as any[]).map((o) => ((o && ((o as any).item || (o as any).name)) || "").toString()).filter(Boolean)
    return Array.from(new Set(names))
  }, [previousOrders, currentOrder])

  useEffect(() => {
    const unsubscribe = realTimeSync.onCustomerNotification((notification) => {
      if (notification.tableNumber !== tableNumber) return

      if (notification.type === "payment_confirmed") {
        setPaymentCompleted(true)
        setShowThankYou(true)

        try {
          const prevNames = JSON.parse(localStorage.getItem("purchasedItemNames") || "[]")
          const mergedNames = Array.from(new Set([...(prevNames as string[]), ...purchasedNames]))
          localStorage.setItem("purchasedItemNames", JSON.stringify(mergedNames))
        } catch (e) {
          // no-op
        }
      }
    })
    return unsubscribe
  }, [tableNumber, purchasedIds, purchasedNames])

  const setQty = (idx: number, qty: number) => {
    const next = currentOrder.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, qty) } : l))
    onUpdateCurrentOrder(next)
  }
  const inc = (idx: number) => setQty(idx, currentOrder[idx].quantity + 1)
  const dec = (idx: number) => setQty(idx, Math.max(1, currentOrder[idx].quantity - 1))
  const remove = (idx: number) => onUpdateCurrentOrder(currentOrder.filter((_, i) => i !== idx))
  const clear = () => onUpdateCurrentOrder([])

  const submitCurrentOrder = async () => {
    if (currentOrder.length === 0) return

    // Build items payload including itemId (required by backend). Try to use item.itemId if present,
    // otherwise attempt to resolve by name via the menu API.
    let items = currentOrder.map((item) => ({
      name: (item.item || item.name || "").toString(),
      quantity: item.quantity,
      price: item.price,
      itemId: (item as any).itemId as number | undefined,
    }))

    // If some items lack itemId, try to resolve them by fetching menu items
    const missing = items.filter((it) => typeof it.itemId === "undefined")
    if (missing.length > 0) {
      try {
        const menu = await fetchMenuItems()
        const map = new Map<string, number>()
        for (const m of menu) {
          map.set((m.name || "").toLowerCase(), Number(m.id))
        }
        items = items.map((it) => {
          if (typeof it.itemId === "undefined") {
            const id = map.get((it.name || "").toLowerCase())
            if (typeof id !== "undefined") return { ...it, itemId: id }
          }
          return it
        })
      } catch (err) {
        console.warn('Failed to fetch menu items to resolve itemId:', err)
      }
    }

    // If still missing itemIds, fallback to client-side session manager and abort server submit
    const stillMissing = items.filter((it) => typeof it.itemId === "undefined")
    if (stillMissing.length > 0) {
      console.error('Cannot submit to server: some items missing itemId', stillMissing)
      // Add locally instead
      sessionManager.addOrderToSession(tableNumber, items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, price: it.price })))
      onUpdateCurrentOrder([])
      return
    }

    // If a server add function is provided, use it; otherwise fallback to local sessionManager
    if (typeof (OrderSummary as any).serverAddOrder === "undefined" && typeof serverAddOrder === "undefined") {
      sessionManager.addOrderToSession(tableNumber, items)
      onUpdateCurrentOrder([])
      return
    }

    try {
      if (serverAddOrder) {
        const res = await serverAddOrder(items)
        if (res && res.session) {
          // parent page should update session state via closure when serverAddOrder is provided
        }
      } else {
        sessionManager.addOrderToSession(tableNumber, items)
      }
      onUpdateCurrentOrder([])
    } catch (err) {
      console.error('Failed to submit order to server', err)
    }
  }

  const requestBill = () => {
    if (!session) return
    setPhoneNumber(session.phoneNumber || "")
    setShowPhoneDialog(true)
  }

  const requestCashPayment = () => {
    if (!session) return

    realTimeSync.emitCashPaymentRequest({
      tableNumber,
      customerPhone: session.phoneNumber || "",
      total: grandTotal,
      items: [
        ...((expandedPreviousOrders || previousOrders || []).flatMap((o: any) => o.items)),
        ...currentOrder.map((l) => ({
          name: (l.item || l.name || "").toString(),
          quantity: l.quantity,
          price: l.price,
        })),
      ],
    })
  }

  const simulateQrPayment = () => {
    setTimeout(() => {
      realTimeSync.emitPaymentConfirmation(Date.now(), "", tableNumber)
    }, 800)
  }

  const handlePhoneSubmit = () => {
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      setPhoneError("Please enter a valid 10-digit phone number")
      return
    }

    if (session) {
      sessionManager.updateSessionPhone(tableNumber, phoneNumber)
    }

    setPhoneError("")
    setShowPhoneDialog(false)
    setShowBillView(true)
  }

  if (showBillView && session) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <img src="/hey-paytm-logo.png" alt="Hey Paytm logo" className="w-10 h-10 rounded-lg shadow-sm" />
              <div>
                <h2 className="font-bold text-lg">Hey Paytm</h2>
                <p className="text-xs text-muted-foreground">Voice Dining Experience</p>
              </div>
            </div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Final Bill
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono">{session.sessionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{session.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Guests:</span>
                <span>{session.guestCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span>{session.phoneNumber || phoneNumber}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold">All Orders</h4>
              {renderPreviousOrders.map((order: any, idx: number) => (
                <div key={order.id} className="space-y-2">
                  <div className="text-xs text-muted-foreground">Order #{idx + 1}</div>
                  {order.items.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>₹{(Number(item.price) || 0) * Number(item.quantity || 0)}</span>
                    </div>
                  ))}
                </div>
              ))}

              {currentOrder.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Current Order (Not Submitted)</div>
                  {currentOrder.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.item || item.name}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{grandTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (5%)</span>
                <span>₹{Math.round(grandTotal * 0.05)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  {Math.round(grandTotal * 1.05)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={requestCashPayment}>
                Request Cash Payment
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={simulateQrPayment}>
                <QrCode className="w-4 h-4 mr-2" />
                Pay via QR
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setShowBillView(false)}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Phone Number</DialogTitle>
            <DialogDescription>Please provide your phone number to receive the bill via SMS.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  setPhoneError("")
                }}
                maxLength={10}
                className={phoneError ? "border-red-500" : ""}
              />
              {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePhoneSubmit}>Continue to Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previousOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              {renderPreviousOrders.map((order, idx) => (
              <div key={order.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Order #{idx + 1}</span>
                  <Badge
                    variant={
                      order.status === "served"
                        ? "default"
                        : order.status === "ready"
                          ? "secondary"
                          : order.status === "preparing"
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
                {order.items.map((item: any, itemIdx: number) => (
                  <div key={itemIdx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Order Total</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentOrder.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items added yet.</div>
          ) : (
            <div className="space-y-3">
              {currentOrder.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{(l.item || l.name || "Item").toString()}</div>
                    <div className="text-xs text-muted-foreground">₹{l.price} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-8 bg-transparent" size="sm" onClick={() => dec(idx)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      className="w-12 h-8 text-center"
                      value={l.quantity}
                      onChange={(e) => setQty(idx, Number.parseInt(e.target.value || "1"))}
                      type="number"
                      min={1}
                    />
                    <Button className="h-8" size="sm" onClick={() => inc(idx)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" className="h-8 bg-transparent" size="sm" onClick={() => remove(idx)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-muted-foreground">Current Order Subtotal</div>
                <div className="font-semibold flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" /> {currentSubtotal}
                </div>
              </div>

              <Button className="w-full" onClick={submitCurrentOrder} disabled={currentOrder.length === 0}>
                Submit Order to Kitchen
              </Button>

              <Button variant="ghost" size="sm" onClick={clear} className="w-full">
                Clear Current Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Orders Submitted</span>
              <span className="font-medium">{previousOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Previous total</span>
              <span className="font-semibold flex items-center gap-1">
                <IndianRupee className="w-4 h-4" /> {sessionTotal}
              </span>
            </div>
            {currentOrder.length > 0 && (
              <div className="flex justify-between text-amber-600">
                <span className="text-sm">+ New Order</span>
                <span className="font-medium">₹{currentSubtotal}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Grand Total</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5" /> {grandTotal}
              </span>
            </div>

            <Button
              className="w-full"
              onClick={requestBill}
              disabled={previousOrders.length === 0 && currentOrder.length === 0}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Request Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {paymentCompleted ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div className="font-semibold text-green-800 mb-1">Payment Confirmed!</div>
            <div className="text-sm text-green-700">Thank you. You can now review purchased dishes from the menu.</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            You can continue ordering throughout your dining session. Submit orders as you go, and request the bill when
            ready.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OrderSummary
