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
import { BackButton } from "@/components/ui/back-button"

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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b py-6 px-4 shadow-sm">
        <div className="max-w-md mx-auto">
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

      <main className="max-w-md mx-auto p-4 space-y-6 -mt-4">
        {/* Order Summary */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="w-6 h-6 text-orange-600" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
        <Card className="shadow-lg border-2 border-green-200 bg-green-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-green-900">Pickup Time</p>
                <p className="text-green-700 font-medium">Ready in 30 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-6 h-6 text-orange-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-6 h-6 text-orange-600" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
                <RadioGroupItem value="upi" id="upi" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-purple-600" />
                  </div>
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">UPI Payment</p>
                      <p className="text-sm text-muted-foreground">Pay using UPI apps</p>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, RuPay</p>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
                <RadioGroupItem value="wallet" id="wallet" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Digital Wallet</p>
                      <p className="text-sm text-muted-foreground">Paytm, PhonePe, Google Pay</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-2 border-amber-300 bg-amber-50 shadow-lg">
          <CardContent className="p-5">
            <h4 className="font-bold text-amber-900 mb-3 text-lg">📋 Pickup Instructions:</h4>
            <ul className="text-sm text-amber-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Show this order confirmation at the counter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Arrive within 15 minutes of ready time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Call us if you're running late</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>No refunds for online payments</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button 
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg" 
          onClick={handlePayment} 
          disabled={isProcessing || cartItems.length===0}
        >
          {isProcessing ? "Processing Payment..." : `💳 Pay ₹${total}`}
        </Button>
      </main>

      {isProcessing && <FullPageLoader text="Processing your payment..." />}
    </div>
  )
}
