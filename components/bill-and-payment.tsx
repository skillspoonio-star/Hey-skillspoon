"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Receipt, Phone, Send, QrCode, Banknote, CheckCircle, Loader2, IndianRupee } from "lucide-react"
import { smsService } from "@/lib/sms-service"
import type { TableSession } from "@/hooks/use-session-manager"

interface BillAndPaymentProps {
  session: TableSession
  onPhoneSubmit: (phone: string) => void
  onPaymentComplete: () => void
}

export function BillAndPayment({ session, onPhoneSubmit, onPaymentComplete }: BillAndPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [billSent, setBillSent] = useState(false)
  const [sendingBill, setSendingBill] = useState(false)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "cash" | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  const subtotal = session.totalAmount
  const tax = Math.round(subtotal * 0.05) // 5% tax
  const total = subtotal + tax

  const handleSendBill = async () => {
    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number")
      return
    }

    setSendingBill(true)
    onPhoneSubmit(phoneNumber)

    const billData = {
      sessionId: session.sessionId,
      tableNumber: session.tableNumber,
      customerName: session.customerName,
      items: session.orders.flatMap((order) => order.items),
      subtotal,
      tax,
      total,
      phoneNumber: `+91${phoneNumber}`,
    }

    const success = await smsService.sendBill(billData)

    setSendingBill(false)
    if (success) {
      setBillSent(true)
      setShowPaymentOptions(true)
    } else {
      alert("Failed to send bill. Please try again.")
    }
  }

  const handlePayment = async (method: "qr" | "cash") => {
    setPaymentMethod(method)
    setProcessingPayment(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setProcessingPayment(false)
    onPaymentComplete()
  }

  return (
    <div className="space-y-6">
      {/* Bill Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session ID:</span>
              <span className="font-mono">{session.sessionId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Table:</span>
              <span className="font-medium">{session.tableNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{session.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Guests:</span>
              <span className="font-medium">{session.guestCount}</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Order Details</h4>
            {session.orders.map((order, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Order #{idx + 1} - {new Date(order.timestamp).toLocaleTimeString()}
                </div>
                {order.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (5%)</span>
              <span className="font-medium">₹{tax}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {total}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Number Input */}
      {!billSent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Enter Phone Number
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your phone number to receive the bill via SMS</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">+91</span>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  className="flex-1"
                />
              </div>
              <Button onClick={handleSendBill} disabled={sendingBill || phoneNumber.length !== 10}>
                {sendingBill ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Bill
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bill Sent Confirmation */}
      {billSent && !paymentMethod && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/50">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-white dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div className="font-semibold text-green-800 dark:text-green-200 mb-1">Bill Sent Successfully!</div>
            <div className="text-sm text-green-700 dark:text-green-300">Check your SMS at +91{phoneNumber}</div>
          </CardContent>
        </Card>
      )}

      {/* Payment Options */}
      {showPaymentOptions && !paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handlePayment("qr")}
              disabled={processingPayment}
              className="w-full h-auto py-4 flex items-center justify-between"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Scan QR Code</div>
                  <div className="text-xs text-muted-foreground">UPI, Cards, Wallets</div>
                </div>
              </div>
              <span className="text-sm">→</span>
            </Button>

            <Button
              onClick={() => handlePayment("cash")}
              disabled={processingPayment}
              className="w-full h-auto py-4 flex items-center justify-between"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Pay with Cash</div>
                  <div className="text-xs text-muted-foreground">Pay at counter</div>
                </div>
              </div>
              <span className="text-sm">→</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Display */}
      {paymentMethod === "qr" && !processingPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Scan to Pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg flex items-center justify-center">
              <img
                src={`/qr-code-for-payment-of--.jpg?height=200&width=200&query=QR code for payment of ₹${total}`}
                alt="Payment QR Code"
                className="w-48 h-48"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">₹{total}</div>
              <div className="text-sm text-muted-foreground">Scan with any UPI app</div>
            </div>
            <Button onClick={onPaymentComplete} className="w-full">
              I've Completed Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cash Payment */}
      {paymentMethod === "cash" && !processingPayment && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-white dark:bg-amber-900 rounded-full flex items-center justify-center">
              <Banknote className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Please Pay at Counter</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">Total Amount: ₹{total}</div>
            </div>
            <Button onClick={onPaymentComplete} className="w-full">
              Payment Completed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Payment */}
      {processingPayment && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <div className="font-semibold mb-1">Processing Payment...</div>
            <div className="text-sm text-muted-foreground">Please wait</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
