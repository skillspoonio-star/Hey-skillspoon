"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { openRazorpayPayment } from "@/lib/razorpay"
import { useTheme } from "next-themes"
import { FullPageLoader } from "@/components/ui/loader"
import { BackButton } from "@/components/ui/back-button"
import { ShoppingCart, MapPin, Clock as ClockIcon, CreditCard as CreditCardIcon } from "lucide-react"

export default function DeliveryCheckoutPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [cart, setCart] = useState<any[]>([])
  const [promo, setPromo] = useState("")
  const [discount, setDiscount] = useState(0)
  const [tip, setTip] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<"PAY_NOW" | "COD">("PAY_NOW")
  const [contactless, setContactless] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [landmark, setLandmark] = useState("")
  const [city, setCity] = useState("")
  const [stateName, setStateName] = useState("")
  const [pincode, setPincode] = useState("")
  const [instructions, setInstructions] = useState("")
  const [slot, setSlot] = useState<"ASAP" | "30min" | "60min" | "schedule">("ASAP")
  const [scheduledTime, setScheduledTime] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCart(JSON.parse(localStorage.getItem("delivery:cart") || "[]"))
    }

    // Cleanup Razorpay script on unmount
    return () => {
      const script = document.getElementById('razorpay-script');
      if (script) {
        script.remove();
      }
    };
  }, [])

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart])
  const deliveryFee = subtotal > 999 ? 0 : 49
  const tax = Math.round(subtotal * 0.18)
  const total = Math.max(0, subtotal - discount) + tax + deliveryFee + tip

  const applyPromo = () => {
    // Simple mock: FLAT50 => ₹50 off, SAVE10 => 10% off (max ₹100)
    if (promo.toUpperCase() === "FLAT50") setDiscount(50)
    else if (promo.toUpperCase() === "SAVE10") setDiscount(Math.min(100, Math.round(subtotal * 0.1)))
    else setDiscount(0)
  }

  const createDeliveryOrder = async (paymentId?: string, paymentSignature?: string) => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
    
    // Validate cart has items
    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty. Please add items before placing order.")
    }

    const deliveryPayload = {
      items: cart.map((l: any) => ({ 
        itemId: Number(l.id), 
        quantity: Number(l.qty) 
      })),
      customerName: name,
      customerPhone: phone,
      address: {
        address1,
        address2,
        landmark,
        city,
        state: stateName,
        pincode,
      },
      slot,
      scheduledTime: slot === "schedule" ? scheduledTime : null,
      contactless,
      instructions,
      paymentMethod: paymentMethod === 'PAY_NOW' ? 'upi' : 'cash',
      paymentStatus: paymentMethod === 'PAY_NOW' ? (paymentId ? 'paid' : 'unpaid') : 'unpaid',
      paymentDetails: paymentId ? {
        paymentId,
        signature: paymentSignature,
        method: 'upi'
      } : undefined,
      promo,
      tip,
      subtotal,
      tax,
      deliveryFee,
      discount,
      total
    }

    console.log('Sending delivery order:', deliveryPayload)

    const res = await fetch(`${base}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryPayload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error("Failed to create delivery order: " + text)
    }

    const data = await res.json()
    return data.orderId || data.id || data._id
  }

  const handleRazorpayPayment = async (orderId: string, amount: number) => {
    return openRazorpayPayment({
      amount,
      orderId,
      name,
      phone,
      theme: theme as "dark" | "light"
    });
  }

  const placeOrder = async () => {
    try {
      setIsProcessingPayment(true)

      if (paymentMethod === 'PAY_NOW') {
        // Create Razorpay order first
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const orderRes = await fetch(base + "/api/razorpay/create-order", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((l: any) => ({ 
              itemId: Number(l.id), 
              quantity: Number(l.qty) 
            })),
            tip,
            promo
          })
        })

        if (!orderRes.ok) {
          const errorData = await orderRes.json().catch(() => null);
          throw new Error(
            errorData?.message || 
            `Failed to create payment order (${orderRes.status})`
          );
        }

        const { order, amounts } = await orderRes.json()
        
        try {
          // Handle payment
          const { paymentId, signature } = await handleRazorpayPayment(order.id, order.amount)
          
          // Create delivery order with payment details
          const orderId = await createDeliveryOrder(paymentId, signature)
          
          if (typeof window !== "undefined") {
            localStorage.removeItem('delivery:cart')
          }

          router.push("/delivery/confirmation?orderId=" + orderId)
        } catch (paymentError: any) {
          // Check if user cancelled payment
          if (paymentError?.message?.includes('closed')) {
            // User closed the payment window
            throw new Error('Payment cancelled. Please try again.')
          } else {
            // Other payment errors
            throw new Error(
              'Payment failed: ' + 
              (paymentError?.message || 'Please try again or choose a different payment method.')
            )
          }
        }
      } else {
        // For COD, directly create delivery order
        try {
          const orderId = await createDeliveryOrder()
          
          if (typeof window !== "undefined") {
            localStorage.removeItem('delivery:cart')
          }

          router.push("/delivery/confirmation?orderId=" + orderId)
        } catch (codError: any) {
          throw new Error(
            'Failed to create COD order: ' + 
            (codError?.message || 'Please try again.')
          )
        }
      }
    } catch (err: any) {
      console.error('Error placing order:', err)
      alert(err?.message || 'Error placing order. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b py-6 px-4 shadow-sm mb-6">
        <div className="max-w-2xl mx-auto">
          <BackButton className="mb-4" fallbackRoute="/delivery/menu" />
          <h1 className="text-3xl font-bold mb-1">🛒 Checkout</h1>
          <p className="text-muted-foreground">Complete your delivery order</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 space-y-6">
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-2">
              {cart.map((line) => (
                <div key={line.id} className="flex items-center justify-between text-sm">
                  <div>
                    {line.qty}x {line.name}
                  </div>
                  <div>₹{line.price * line.qty}</div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  Delivery Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Phone *</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit phone"
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-semibold">Address Line 1 *</Label>
                    <Input
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="House/Flat, Street"
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-semibold">Address Line 2 (optional)</Label>
                    <Input
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Area / Locality"
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-semibold">Landmark (optional)</Label>
                    <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near ..." className="h-11" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">City *</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-11" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">State *</Label>
                    <Input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="h-11" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Pincode *</Label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit pincode"
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-semibold">Delivery Instructions (optional)</Label>
                    <Input
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g., leave at door"
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-orange-600" />
                    Delivery Time
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {(["ASAP", "30min", "60min", "schedule"] as const).map((opt) => (
                      <Button
                        key={opt}
                        variant={slot === opt ? "default" : "outline"}
                        onClick={() => setSlot(opt)}
                        className={`text-sm h-11 font-semibold ${slot === opt ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      >
                        {opt === "schedule" ? "Schedule" : opt}
                      </Button>
                    ))}
                  </div>
                  {slot === "schedule" && (
                    <div className="mt-2">
                      <Input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="text-sm h-11"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-sm font-semibold mb-2 block">🎁 Have a promo code?</Label>
                <div className="flex items-center gap-2">
                  <Input placeholder="Enter promo code" value={promo} onChange={(e) => setPromo(e.target.value)} className="h-11" />
                  <Button variant="outline" onClick={applyPromo} className="h-11 px-6 font-semibold">
                    Apply
                  </Button>
                </div>
                {discount > 0 && <div className="text-sm text-green-600 font-semibold mt-2">✓ Discount applied: -₹{discount}</div>}
              </div> */}

              <Separator />

              <div className="flex items-center justify-between">
                <div>Subtotal</div>
                <div>₹{subtotal}</div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>GST (18%)</div>
                <div>₹{tax}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>Delivery Charge</div>
                <div>{deliveryFee === 0 ? "Free" : "₹" + deliveryFee}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">💝 Tip for delivery partner</Label>
                  <span className="font-bold text-orange-600">₹{tip}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 20, 50, 100].map((v) => (
                    <Button 
                      key={v} 
                      size="sm" 
                      variant={tip === v ? "default" : "outline"} 
                      onClick={() => setTip(v)}
                      className={`h-10 font-semibold ${tip === v ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    >
                      {v === 0 ? "No Tip" : "₹" + v}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between font-bold text-lg">
                <div>Total</div>
                <div>₹{total}</div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CreditCardIcon className="w-4 h-4 text-orange-600" />
                  Payment Method
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={paymentMethod === "PAY_NOW" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("PAY_NOW")}
                    className={`h-12 font-semibold ${paymentMethod === "PAY_NOW" ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  >
                    �  Pay Now
                  </Button>
                  <Button
                    variant={paymentMethod === "COD" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("COD")}
                    className={`h-12 font-semibold ${paymentMethod === "COD" ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  >
                    💵 Cash on Delivery
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer">
                <input type="checkbox" checked={contactless} onChange={(e) => setContactless(e.target.checked)} className="w-4 h-4" />
                <span className="font-medium">🛡️ Contactless delivery (recommended)</span>
              </label>
              <Button
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
                disabled={isProcessingPayment}
                onClick={async () => {
                  // Check if cart is empty
                  if (!cart || cart.length === 0) {
                    alert("Your cart is empty. Please add items before checkout.")
                    router.push("/delivery/menu")
                    return
                  }

                  // basic validations
                  if (!name || phone.length !== 10 || !address1 || !city || !stateName || pincode.length !== 6) {
                    alert("Please complete delivery details before proceeding.")
                    return
                  }

                  // proceed with order placement
                  await placeOrder()
                }}
              >
                {isProcessingPayment ? "Processing..." : paymentMethod === "PAY_NOW" ? "💳 Pay Now" : "📦 Place Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {isProcessingPayment && <FullPageLoader text="Processing your order..." />}
    </div>
  )
}
