"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Clock, User, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { FullPageLoader } from "@/components/ui/loader"
import { BackButton } from "@/components/ui/back-button"
import { openRazorpayPayment } from "@/lib/razorpay"
import { useTheme } from "next-themes"
import { useToast } from "@/components/providers/toast-provider"

export default function TakeawayCheckoutPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { success, error, warning } = useToast()
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"PAY_NOW" | "COD">("PAY_NOW")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cartItems, setCartItems] = useState<Array<any>>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('takeaway_cart')
      if (raw) setCartItems(JSON.parse(raw))
    } catch (err) {
      console.error('Failed to load cart from localStorage', err)
    }

    // Cleanup Razorpay script on unmount
    return () => {
      const script = document.getElementById('razorpay-script');
      if (script) {
        script.remove();
      }
    };
  }, [])

  // cartItems loaded from localStorage

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxRate = Math.round(subtotal * 0.05) // 5% tax
  const packagingFee = 20
  const taxes = taxRate + packagingFee // Include packaging fee in tax field for backend compatibility
  const total = subtotal + taxes

  const createTakeawayOrder = async (paymentId?: string, paymentSignature?: string) => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

    // Validate cart has items
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty. Please add items before placing order.")
    }

    const takeawayPayload = {
      items: cartItems.map((it: any) => ({
        itemId: Number(it.id),
        quantity: Number(it.quantity)
      })),
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      paymentMethod: paymentMethod === 'PAY_NOW' ? 'upi' : 'cash',
      paymentStatus: paymentMethod === 'PAY_NOW' ? (paymentId ? 'paid' : 'unpaid') : 'unpaid',
      paymentDetails: paymentId ? {
        paymentId,
        signature: paymentSignature,
        method: 'upi'
      } : undefined,
      orderType: 'take-away',
      subtotal,
      tax: taxes,
      discount: 0,
      total
    }

    console.log('Sending takeaway order:', takeawayPayload)

    const res = await fetch(`${base}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(takeawayPayload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error("Failed to create takeaway order: " + text)
    }

    const data = await res.json()
    return data.orderId || data.id || data._id
  }

  const handleRazorpayPayment = async (orderId: string, amount: number) => {
    return openRazorpayPayment({
      amount,
      orderId,
      name: customerInfo.name,
      phone: customerInfo.phone,
      theme: theme as "dark" | "light"
    });
  }

  const handlePayment = async () => {
    try {
      setIsProcessing(true)

      // Basic validations
      if (!customerInfo.name || !customerInfo.phone) {
        warning("Please fill in all required fields (Name and Phone)", "Missing Information")
        return
      }

      if (paymentMethod === 'PAY_NOW') {
        // Create Razorpay order first
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const orderRes = await fetch(base + "/api/razorpay/create-order", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems.map((it: any) => ({
              itemId: Number(it.id),
              quantity: Number(it.quantity)
            }))
          })
        })

        if (!orderRes.ok) {
          const errorData = await orderRes.json().catch(() => null);
          throw new Error(
            errorData?.message ||
            `Failed to create payment order (${orderRes.status})`
          );
        }

        const { order } = await orderRes.json()

        try {
          // Handle payment
          const { paymentId, signature } = await handleRazorpayPayment(order.id, order.amount)

          // Create takeaway order with payment details
          const orderId = await createTakeawayOrder(paymentId, signature)
          success("Payment successful! Your order has been placed.", "Order Confirmed")

          localStorage.removeItem('takeaway_cart')
          router.push("/takeaway/confirmation?orderId=" + orderId)
        } catch (paymentError: any) {
          // Check if user cancelled payment
          if (paymentError?.message?.includes('cancelled by user') || paymentError?.message?.includes('closed')) {
            error('Payment failed. Please try again or choose Cash on Pickup.', 'Payment Failed')
          } else {
            error(
              'Payment failed: ' +
              (paymentError?.message || 'Please try again or choose a different payment method.'),
              'Payment Error'
            )
          }
        }
      } else {
        // For COD, directly create takeaway order
        try {
          const orderId = await createTakeawayOrder()
          success("Order placed successfully! You can pay when you pick up.", "Order Confirmed")

          localStorage.removeItem('takeaway_cart')
          router.push("/takeaway/confirmation?orderId=" + orderId)
        } catch (codError: any) {
          error(
            'Failed to create COD order: ' +
            (codError?.message || 'Please try again.'),
            'Order Error'
          )
        }
      }
    } catch (err: any) {
      console.error('Error placing order:', err)
      error(err?.message || 'Error placing order. Please try again.', 'Order Error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b py-6 px-4 shadow-sm mb-6">
        <div className="max-w-2xl mx-auto">
          <BackButton className="mb-4" fallbackRoute="/takeaway/menu" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">🛒 Checkout</h1>
              <p className="text-muted-foreground">Complete your takeaway order</p>
            </div>
            <Badge variant="secondary" className="font-semibold">Takeaway</Badge>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 space-y-6">
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-orange-600" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    {item.quantity}x {item.name}
                  </div>
                  <div>₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-4">
              {/* Pickup Time */}
              <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 dark:text-green-100">Pickup Time</p>
                    <p className="text-green-700 dark:text-green-300 text-sm">Ready in 30 minutes</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">Full Name *</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Phone Number *</Label>
                    <Input
                      placeholder="Enter your phone number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-semibold">Email (Optional)</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>Subtotal</div>
                <div>₹{subtotal}</div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>Tax (5%)</div>
                <div>₹{taxRate}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>Packaging Fee</div>
                <div>₹{packagingFee}</div>
              </div>

              <Separator />

              <div className="flex items-center justify-between font-bold text-lg">
                <div>Total</div>
                <div>₹{total}</div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  Payment Method
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={paymentMethod === "PAY_NOW" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("PAY_NOW")}
                    className={`h-12 font-semibold ${paymentMethod === "PAY_NOW" ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  >
                    💳 Pay Now
                  </Button>
                  <Button
                    variant={paymentMethod === "COD" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("COD")}
                    className={`h-12 font-semibold ${paymentMethod === "COD" ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  >
                    💵 Cash on Pickup
                  </Button>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-3">📋 Pickup Instructions:</h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                    <span>Show this order confirmation at the counter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                    <span>Arrive within 15 minutes of ready time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                    <span>Call us if you're running late</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                    <span>No refunds for online payments</span>
                  </li>
                </ul>
              </div>

              <Button
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
                onClick={async () => {
                  // Check if cart is empty
                  if (!cartItems || cartItems.length === 0) {
                    warning("Your cart is empty. Please add items before checkout.", "Empty Cart")
                    router.push("/takeaway/menu")
                    return
                  }

                  // Basic validations
                  if (!customerInfo.name || !customerInfo.phone) {
                    warning("Please complete customer information before proceeding.", "Missing Information")
                    return
                  }

                  // Proceed with order placement
                  await handlePayment()
                }}
                disabled={isProcessing || cartItems.length === 0}
              >
                {isProcessing ? "Processing..." : paymentMethod === "PAY_NOW" ? "💳 Pay Now" : "📦 Place Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {isProcessing && <FullPageLoader text="Processing your payment..." />}
    </div>
  )
}
