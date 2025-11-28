"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingBag, Clock, User, CreditCard, Wallet, QrCode } from "lucide-react"
import { useRouter } from "next/navigation"
import { FullPageLoader } from "@/components/ui/loader"

export default function TakeawayCheckoutPage() {
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cartItems, setCartItems] = useState<Array<any>>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('takeaway_cart')
      if (raw) setCartItems(JSON.parse(raw))
    } catch (err) {
      console.error('Failed to load cart from localStorage', err)
    }
  }, [])

  // cartItems loaded from localStorage

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxes = Math.round(subtotal * 0.05) // 5% tax
  const packagingFee = 20
  const total = subtotal + taxes + packagingFee

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please fill in all required fields")
      return
    }

    setIsProcessing(true)

    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        // build order payload expected by backend: items as { itemId, quantity }
        const payload = {
          items: cartItems.map((it: any) => ({ itemId: it.id, quantity: it.quantity })),
          subtotal: cartItems.reduce((s: number, it: any) => s + it.price * it.quantity, 0),
          tax: Math.round(cartItems.reduce((s: number, it: any) => s + it.price * it.quantity, 0) * 0.05)+20,
          discount: 0,
          total: cartItems.reduce((s: number, it: any) => s + it.price * it.quantity, 0) + Math.round(cartItems.reduce((s: number, it: any) => s + it.price * it.quantity, 0) * 0.05) + 20,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          paymentStatus: "paid",
          paymentMethod,
          orderType: 'take-away',
        }

        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Failed to create takeaway order', res.status, text)
          setIsProcessing(false)
          alert('Payment succeeded but order creation failed. Please contact support.')
          return
        }
        const data = await res.json()
        const orderId = data.orderId || data.id || data._id

        // clear cart and navigate to confirmation with order id
        localStorage.removeItem('takeaway_cart')
        router.push(`/takeaway/confirmation?orderId=${orderId}`)
      } catch (err) {
        console.error('Error creating takeaway order', err)
        setIsProcessing(false)
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg text-foreground">Checkout</h1>
              <p className="text-xs text-muted-foreground">Complete your takeaway order</p>
            </div>
          </div>
          <Badge variant="secondary">Takeaway</Badge>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">₹{item.price * item.quantity}</p>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxes & Fees</span>
                <span>₹{taxes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Packaging Fee</span>
                <span>₹{packagingFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Pickup Time</p>
                <p className="text-sm text-muted-foreground">Ready in 30 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="upi" id="upi" />
                <div className="flex items-center gap-2 flex-1">
                  <QrCode className="w-5 h-5 text-primary" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">UPI Payment</p>
                      <p className="text-sm text-muted-foreground">Pay using UPI apps</p>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <div className="flex items-center gap-2 flex-1">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, RuPay</p>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="wallet" id="wallet" />
                <div className="flex items-center gap-2 flex-1">
                  <Wallet className="w-5 h-5 text-primary" />
                  <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Digital Wallet</p>
                      <p className="text-sm text-muted-foreground">Paytm, PhonePe, Google Pay</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-amber-800 mb-2">Pickup Instructions:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Show this order confirmation at the counter</li>
              <li>• Arrive within 15 minutes of ready time</li>
              <li>• Call us if you're running late</li>
              <li>• No refunds for online payments</li>
            </ul>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button className="w-full h-12 text-base font-medium" onClick={handlePayment} disabled={isProcessing || cartItems.length===0}>
          {isProcessing ? "Processing Payment..." : `Pay ₹${total}`}
        </Button>
      </main>

      {isProcessing && <FullPageLoader text="Processing your payment..." />}
    </div>
  )
}
