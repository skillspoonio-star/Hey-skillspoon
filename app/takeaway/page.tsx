"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, Star, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TakeawayPage() {
  const router = useRouter()
  const [selectedTime, setSelectedTime] = useState<string>("")

  const timeSlots = ["Instantly", "15 mins", "30 mins", "45 mins", "1 hour", "1.5 hours", "2 hours"]

  const restaurantInfo = {
    name: "Spice Garden Restaurant",
    rating: 4.5,
    reviews: 1250,
    cuisine: "Indian • North Indian • Biryani",
    address: "123 Food Street, Sector 18, Noida",
    phone: "+91 98765 43210",
    preparationTime: "15-30 mins",
    isOpen: true,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="absolute right-0 top-0 h-full w-24" viewBox="0 0 100 100" fill="currentColor">
            <path d="M20,20 Q80,20 80,80 Q20,80 20,20" className="text-green-500" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <img
              src="/hey-paytm-logo.png"
              alt="Hey Paytm logo"
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg"
            />
            <h1 className="font-sans font-bold text-lg md:text-xl text-foreground">Hey Paytm</h1>
          </div>
          <Badge variant={restaurantInfo.isOpen ? "default" : "destructive"} className="shadow-sm text-sm md:text-base">
            {restaurantInfo.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src="/indian-food-platter.jpg" alt="Restaurant Food" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 md:mb-3">
                  {restaurantInfo.name}
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-sm md:text-base">{restaurantInfo.rating}</span>
                  </div>
                  <span className="text-sm md:text-base text-muted-foreground">({restaurantInfo.reviews} reviews)</span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">{restaurantInfo.cuisine}</p>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{restaurantInfo.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{restaurantInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Preparation: {restaurantInfo.preparationTime}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-primary">
              <circle cx="50" cy="50" r="40" />
            </svg>
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              When do you want to pickup?
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className={`text-xs md:text-sm transition-all ${selectedTime === time ? "shadow-md scale-105" : "hover:scale-105"}`}
                >
                  {time}
                </Button>
              ))}
            </div>
            {selectedTime && (
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-muted to-muted/50 rounded-lg border border-primary/20">
                <p className="text-sm md:text-base text-muted-foreground">
                  {selectedTime === "Instantly" ? (
                    <>
                      Your order will be prepared <span className="font-medium text-foreground">immediately</span> and
                      ready for pickup as soon as possible
                    </>
                  ) : (
                    <>
                      Your order will be ready for pickup in{" "}
                      <span className="font-medium text-foreground">{selectedTime}</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Type Info */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-green-500/5 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <ShoppingBag className="w-16 h-16 md:w-20 md:h-20 text-primary" />
          </div>
          <CardContent className="p-4 md:p-6 relative z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-base md:text-lg text-foreground">Self-Order Takeaway</h3>
                <p className="text-sm md:text-base text-muted-foreground">Order online, pay online, pickup yourself</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 md:space-y-4">
          <Button
            className="w-full h-12 md:h-14 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-primary to-primary/90"
            onClick={() => router.push("/takeaway/menu")}
            disabled={!selectedTime}
          >
            Start Ordering
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 md:h-14 text-base md:text-lg bg-transparent hover:bg-primary/5 border-primary/20"
            onClick={() => router.push("/restaurant-info")}
          >
            View Restaurant Details
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 md:p-6">
            <h4 className="font-medium text-amber-800 mb-2 text-base md:text-lg">Important Notes:</h4>
            <ul className="text-sm md:text-base text-amber-700 space-y-1">
              <li>• Payment must be completed online</li>
              <li>• No delivery service available</li>
              <li>• Please arrive on time for pickup</li>
              <li>• Show order confirmation at counter</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
