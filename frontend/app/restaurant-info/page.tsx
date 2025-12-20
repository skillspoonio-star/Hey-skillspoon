"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Wifi,
  Car,
  CreditCard,
  Users,
  Calendar,
  Menu,
  Camera,
  Share,
  Heart,
  Navigation,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function RestaurantInfoPage() {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)

  // const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  const restaurantData = {
    name: "Spice Garden Restaurant",
    rating,
    reviews: totalReviews,

    priceRange: "₹₹",
    cuisine: ["Indian", "North Indian", "Biryani", "Vegetarian"],
    description:
      "Experience authentic Indian flavors in a warm, welcoming atmosphere. Our chefs use traditional recipes passed down through generations, combined with the finest ingredients to create memorable dining experiences.",
    address: "123 Food Street, Sector 18, Noida, Uttar Pradesh 201301",
    phone: "+91 98765 43210",
    email: "info@spicegarden.com",
    website: "www.spicegarden.com",
    hours: {
      monday: "11:00 AM - 11:00 PM",
      tuesday: "11:00 AM - 11:00 PM",
      wednesday: "11:00 AM - 11:00 PM",
      thursday: "11:00 AM - 11:00 PM",
      friday: "11:00 AM - 12:00 AM",
      saturday: "11:00 AM - 12:00 AM",
      sunday: "11:00 AM - 11:00 PM",
    },
    amenities: [
      { icon: <Wifi className="w-4 h-4" />, name: "Free WiFi" },
      { icon: <Car className="w-4 h-4" />, name: "Parking Available" },
      { icon: <CreditCard className="w-4 h-4" />, name: "Card Payments" },
      { icon: <Users className="w-4 h-4" />, name: "Family Friendly" },
    ],
    photos: [
      "/modern-restaurant-interior.png",
      "/indian-food-platter.jpg",
      "/restaurant-dining-area.png",
      "/chef-cooking.png",
    ],
    specialties: [
      "Authentic Biryani",
      "Tandoor Specialties",
      "Fresh Naan Bread",
      "Traditional Curries",
      "Vegetarian Options",
      "Dessert Selection",
    ],
  }

  const getCurrentStatus = () => {
    const now = new Date()
    const currentHour = now.getHours()

    // Simplified logic - restaurant is open 11 AM to 11 PM
    if (currentHour >= 11 && currentHour < 23) {
      return { isOpen: true, status: "Open Now", nextChange: "Closes at 11:00 PM" }
    } else {
      return { isOpen: false, status: "Closed", nextChange: "Opens at 11:00 AM" }
    }
  }

  const status = getCurrentStatus()
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    async function fetchReviews() {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/reviews`)
        if (!res.ok) throw new Error("Failed to fetch reviews")
        const data = await res.json()

        setReviews(data)

        if (data.length > 0) {
          const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length
          setRating(parseFloat(avg.toFixed(1)))
          setTotalReviews(data.length)
        } else {
          setRating(0)
          setTotalReviews(0)
        }
      } catch (err) {
        console.error("Error fetching reviews:", err)
      }
    }
    fetchReviews()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-full opacity-5">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-primary">
            <path d="M20,0 Q80,0 100,50 Q80,100 20,100 Q0,50 20,0" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <img
              src="/hey-paytm-logo.png"
              alt="Hey Paytm logo"
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg"
            />
            {/* </CHANGE> */}
            <h1 className="font-sans font-bold text-lg md:text-xl text-foreground">Hey Paytm</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorite(!isFavorite)}
              className="hover:bg-primary/10"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="relative h-64 md:h-80 lg:h-96 bg-muted overflow-hidden">
          <img src="/indian-restaurant-interior.png" alt="Restaurant Interior" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={status.isOpen ? "default" : "destructive"}
                className="shadow-lg backdrop-blur-sm text-sm md:text-base"
              >
                {status.status}
              </Badge>
              <span className="text-white text-sm md:text-base font-medium drop-shadow-md">{status.nextChange}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 md:top-6 right-4 md:right-6 backdrop-blur-sm bg-white/90 hover:bg-white shadow-lg"
          >
            <Camera className="w-4 h-4 mr-2" />
            View Photos
          </Button>
        </div>

        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          <div className="relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 opacity-5">
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-primary">
                <circle cx="50" cy="50" r="40" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 md:mb-3 relative z-10">
              {restaurantData.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-base md:text-lg">{restaurantData.rating}</span>
                <span className="text-sm md:text-base text-muted-foreground">({restaurantData.reviews} reviews)</span>
              </div>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <span className="text-sm md:text-base text-muted-foreground">{restaurantData.priceRange}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {restaurantData.cuisine.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-sm md:text-base"
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{restaurantData.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <Button
              className="h-12 md:h-14 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/90"
              onClick={() => router.push("/restaurant-info/menu")}
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              View Menu
            </Button>
            <Button
              variant="outline"
              className="h-12 md:h-14 text-base md:text-lg bg-transparent hover:bg-primary/5 border-primary/20 shadow-md"
              onClick={() => router.push("/restaurant-info/reservations")}
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Reserve Table
            </Button>
            <Button
              variant="outline"
              className="h-12 md:h-14 text-base md:text-lg bg-transparent hover:bg-green-50 border-green-200 shadow-md"
            >
              <Navigation className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Get Directions
            </Button>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 h-11 md:h-12">
              <TabsTrigger value="info" className="text-sm md:text-base">
                Info
              </TabsTrigger>
              <TabsTrigger value="hours" className="text-sm md:text-base">
                Hours
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-sm md:text-base">
                Photos
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-sm md:text-base">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6 md:space-y-8">
              {/* Contact Information */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 md:p-4 rounded-lg bg-muted/30">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm md:text-base">Address</p>
                      <p className="text-sm md:text-base text-muted-foreground">{restaurantData.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm md:text-base">Phone</p>
                      <p className="text-sm md:text-base text-muted-foreground">{restaurantData.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Wifi className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                    Amenities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {restaurantData.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {amenity.icon}
                        </div>
                        <span className="text-sm md:text-base">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specialties */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                    </div>
                    Our Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {restaurantData.specialties.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant="outline"
                        className="justify-start hover:bg-primary/5 transition-colors text-sm md:text-base px-3 py-2"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hours">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    Opening Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(restaurantData.hours).map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-medium capitalize text-sm md:text-base">{day}</span>
                        <span className="text-sm md:text-base text-muted-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {restaurantData.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-muted rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
                  >
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Restaurant photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-4 md:space-y-6">
                {/* Review Summary */}
                <Card className="shadow-md">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-4xl md:text-5xl font-bold">{restaurantData.rating}</div>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 md:w-5 md:h-5 ${star <= restaurantData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm md:text-base text-muted-foreground">
                          {restaurantData.reviews} reviews
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Reviews */}
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-primary-foreground text-sm md:text-base font-medium">
                                {review.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-sm md:text-base">{review.name}</span>
                          </div>
                          <span className="text-xs md:text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 md:w-4 md:h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
