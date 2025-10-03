"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, MapPin, Phone, Download, Share } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TakeawayConfirmationPage() {
  const router = useRouter()
  const [orderStatus, setOrderStatus] = useState("confirmed")
  const [estimatedTime, setEstimatedTime] = useState(30)

  // Mock order data
  const orderDetails = {
    orderId: "TKW" + Math.random().toString(36).substr(2, 6).toUpperCase(),
    items: [
      { name: "Chicken Biryani", quantity: 1, price: 299 },
      { name: "Paneer Tikka", quantity: 1, price: 249 },
      { name: "Butter Naan", quantity: 2, price: 98 },
    ],
    total: 666,
    paymentMethod: "UPI",
    customerName: "John Doe",
    customerPhone: "+91 98765 43210",
    restaurantInfo: {
      name: "Spice Garden Restaurant",
      address: "123 Food Street, Sector 18, Noida",
      phone: "+91 98765 43210",
    },
  }

  useEffect(() => {
    // Simulate order status updates
    const statusUpdates = [
      { status: "confirmed", time: 0 },
      { status: "preparing", time: 5000 },
      { status: "ready", time: 25000 },
    ]

    statusUpdates.forEach(({ status, time }) => {
      setTimeout(() => {
        setOrderStatus(status)
        if (status === "preparing") {
          setEstimatedTime(25)
        } else if (status === "ready") {
          setEstimatedTime(0)
        }
      }, time)
    })
  }, [])

  const getStatusInfo = () => {
    switch (orderStatus) {
      case "confirmed":
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          title: "Order Confirmed!",
          description: "Your order has been received and is being prepared",
          color: "bg-green-50 border-green-200",
        }
      case "preparing":
        return {
          icon: <Clock className="w-6 h-6 text-orange-600" />,
          title: "Preparing Your Order",
          description: "Our chefs are working on your delicious meal",
          color: "bg-orange-50 border-orange-200",
        }
      case "ready":
        return {
          icon: <CheckCircle className="w-6 h-6 text-primary" />,
          title: "Order Ready for Pickup!",
          description: "Your order is ready. Please come to collect it",
          color: "bg-primary/10 border-primary/20",
        }
      default:
        return {
          icon: <Clock className="w-6 h-6 text-gray-600" />,
          title: "Processing...",
          description: "Please wait",
          color: "bg-gray-50 border-gray-200",
        }
    }
  }

  const statusInfo = getStatusInfo()

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
              <h1 className="font-sans font-bold text-lg text-foreground">Order Confirmation</h1>
              <p className="text-xs text-muted-foreground">Order #{orderDetails.orderId}</p>
            </div>
          </div>
          <Badge variant="default">Takeaway</Badge>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Status */}
        <Card className={`${statusInfo.color}`}>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">{statusInfo.icon}</div>
            <h2 className="text-xl font-bold mb-2">{statusInfo.title}</h2>
            <p className="text-muted-foreground mb-4">{statusInfo.description}</p>

            {estimatedTime > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Estimated time: {estimatedTime} minutes</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{item.price}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span>₹{orderDetails.total}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Payment Method: {orderDetails.paymentMethod}</p>
              <p>
                Payment Status: <span className="text-green-600 font-medium">Completed</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium">Name:</span> {orderDetails.customerName}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {orderDetails.customerPhone}
            </p>
          </CardContent>
        </Card>

        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{orderDetails.restaurantInfo.name}</p>
              <p className="text-sm text-muted-foreground">{orderDetails.restaurantInfo.address}</p>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{orderDetails.restaurantInfo.phone}</span>
            </div>

            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Get Directions
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Share className="w-4 h-4" />
              Share
            </Button>
          </div>

          <Button className="w-full" onClick={() => router.push("/takeaway")}>
            Order Again
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-800 mb-2">Pickup Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Show this confirmation screen at the counter</li>
              <li>• Mention your order ID: {orderDetails.orderId}</li>
              <li>• Please arrive within 15 minutes of ready time</li>
              <li>• Call the restaurant if you need any assistance</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
