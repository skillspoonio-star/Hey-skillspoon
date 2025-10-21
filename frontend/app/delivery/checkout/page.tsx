"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DeliveryCheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<any[]>([])
  const [promo, setPromo] = useState("")
  const [discount, setDiscount] = useState(0)
  const [tip, setTip] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Card" | "COD">("UPI")
  const [contactless, setContactless] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [landmark, setLandmark] = useState("")
  const [city, setCity] = useState("")
  const [stateName, setStateName] = useState("")
  const [pincode, setPincode] = useState("")
  const [instructions, setInstructions] = useState("")
  const [slot, setSlot] = useState<"ASAP" | "30min" | "60min" | "schedule">("ASAP")
  const [scheduledTime, setScheduledTime] = useState<string>("")
  const [upiId, setUpiId] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExp, setCardExp] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCart(JSON.parse(localStorage.getItem("delivery:cart") || "[]"))
    }
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

  const placeOrder = async () => {
    const customerPayload = {
      name,
      phone,
      address: [address1, address2].filter(Boolean).join(", "),
      landmark,
      city,
      state: stateName,
      pincode,
      instructions,
      slot,
      scheduledTime: slot === "schedule" ? scheduledTime : null,
    }

    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const payload = {
        items: cart.map((l: any) => ({ itemId: l.id, quantity: l.qty })),
        subtotal,
        tax,
        deliveryFee,
        discount,
        tip,
        total,
        customerName: customerPayload.name,
        customerPhone: customerPayload.phone,
        address: {
          line1: address1,
          line2: address2 || null,
          landmark: landmark || null,
          city,
          state: stateName,
          pincode,
        },
        delivery: {
          slot: customerPayload.slot,
          scheduledTime: customerPayload.scheduledTime || null,
          contactless,
          instructions,
        },
        paymentMethod,
        payment: {
          method: paymentMethod,
          promo,
          discount,
          tip,
          deliveryFee,
          tax,
          subtotal,
          upiId: paymentMethod === "UPI" ? upiId : null,
          card: paymentMethod === "Card" ? { cardNumber, cardName, cardExp } : null,
        },
        orderType: 'delivery',
      }

      const res = await fetch(`${base}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payload.items,
          subtotal: payload.subtotal,
          tax: payload.tax,
          extraCharge: (payload.tip || 0) + (payload.deliveryFee || 0),
          discount: payload.discount,
          total: payload.total,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          address: {
            address1,
            address2,
            landmark,
            city,
            state: stateName,
            pincode,
          },
          slot: payload.delivery.slot,
          scheduledTime: payload.delivery.scheduledTime,
          contactless: payload.delivery.contactless,
          instructions: payload.delivery.instructions,
          paymentMethod: paymentMethod === 'UPI' ? 'upi' : paymentMethod === 'Card' ? 'card' : 'cash',
          paymentStatus: 'paid',
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Failed to create delivery order', res.status, text)
        alert('Failed to place order. Please try again or contact support.')
        return
      }
      const data = await res.json()
      const orderId = data.orderId || data.id || data._id

      if (typeof window !== "undefined") {
        localStorage.setItem("delivery:latestTotal", String(total))
        localStorage.setItem("delivery:customer", JSON.stringify(customerPayload))
        localStorage.removeItem('delivery:cart')
      }

      router.push(`/delivery/confirmation?orderId=${orderId}`)
    } catch (err) {
      console.error('Error placing delivery order', err)
      alert('Error placing order. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="space-y-3">
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Delivery Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <Label className="text-sm">Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit phone"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm">Address Line 1</Label>
                    <Input
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="House/Flat, Street"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm">Address Line 2 (optional)</Label>
                    <Input
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Area / Locality"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm">Landmark (optional)</Label>
                    <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near ..." />
                  </div>
                  <div>
                    <Label className="text-sm">City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label className="text-sm">State</Label>
                    <Input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" />
                  </div>
                  <div>
                    <Label className="text-sm">Pincode</Label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit pincode"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm">Delivery Instructions (optional)</Label>
                    <Input
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g., leave at door"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Delivery Time</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {(["ASAP", "30min", "60min", "schedule"] as const).map((opt) => (
                      <Button
                        key={opt}
                        variant={slot === opt ? "default" : "outline"}
                        onClick={() => setSlot(opt)}
                        className="text-sm"
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
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Input placeholder="Promo code" value={promo} onChange={(e) => setPromo(e.target.value)} />
                <Button variant="outline" onClick={applyPromo}>
                  Apply
                </Button>
              </div>
              {discount > 0 && <div className="text-sm text-green-600">Discount applied: -₹{discount}</div>}

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
                <div>Delivery Fee</div>
                <div>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>Tip</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 20, 50, 100].map((v) => (
                      <Button key={v} size="sm" variant={tip === v ? "default" : "outline"} onClick={() => setTip(v)}>
                        {v === 0 ? "No Tip" : `₹${v}`}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>₹{tip}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant={paymentMethod === "UPI" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    UPI
                  </Button>
                  <Button
                    variant={paymentMethod === "Card" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("Card")}
                  >
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === "COD" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    COD
                  </Button>
                </div>

                {paymentMethod === "UPI" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-sm">UPI ID</Label>
                      <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank" />
                    </div>
                  </div>
                )}

                {paymentMethod === "Card" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-sm">Card Number</Label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 19))}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Name on Card</Label>
                      <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div>
                      <Label className="text-sm">Expiry (MM/YY)</Label>
                      <Input
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value.replace(/[^0-9/]/g, "").slice(0, 5))}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">CVV</Label>
                      <Input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="***"
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={contactless} onChange={(e) => setContactless(e.target.checked)} />
                Contactless delivery
              </label>

              <div className="flex items-center justify-between font-semibold text-base">
                <div>Total</div>
                <div>₹{total}</div>
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  // basic validations
                  if (!name || phone.length !== 10 || !address1 || !city || !stateName || pincode.length !== 6) {
                    alert("Please complete delivery details before paying.")
                    return
                  }
                  if (paymentMethod === "UPI" && !upiId.includes("@")) {
                    alert("Please enter a valid UPI ID.")
                    return
                  }
                  if (
                    paymentMethod === "Card" &&
                    (cardNumber.replace(/\s/g, "").length < 16 || !cardExp || cardCvv.length < 3)
                  ) {
                    alert("Please enter valid card details.")
                    return
                  }

                  // proceed with mock payment + order placement
                  await placeOrder()
                }}
              >
                Pay & Place Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
