"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ShoppingBag,
  Calendar,
  Settings,
  Info,
  Menu,
  Clock,
  MapPin,
  Phone,
  Star,
  ChefHat,
  Utensils,
  Truck,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<string>("")

  const restaurantInfo = {
    name: "Spice Garden Restaurant",
    rating: 4.5,
    reviews: 1250,
    address: "123 Food Street, Sector 18, Noida",
    phone: "+91 98765 43210",
    isOpen: true,
    openHours: "11:00 AM - 11:00 PM",
  }

  const services = [
    {
      id: "dine-in",
      title: "Dine-In Experience",
      description: "Voice-powered ordering at your table",
      icon: <Utensils className="w-8 h-8" />,
      color: "bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 dark:border-primary/30",
      iconBg: "bg-white/20 dark:bg-white/10",
      buttonBg: "bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20",
      action: () => setSelectedService("dine-in"),
    },
    {
      id: "takeaway",
      title: "Self-Order Takeaway",
      description: "Order online, pay online, pickup yourself",
      icon: <ShoppingBag className="w-8 h-8" />,
      color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
      iconBg: "bg-white/20 dark:bg-white/10",
      buttonBg: "bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 dark:text-green-400",
      action: () => router.push("/takeaway"),
    },
    {
      id: "delivery",
      title: "Online Home Delivery",
      description: "Order online, doorstep delivery",
      icon: <Truck className="w-8 h-8" />,
      color: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      iconBg: "bg-white/20 dark:bg-white/10",
      buttonBg: "bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 dark:text-rose-400",
      action: () => router.push("/delivery"),
    },
    {
      id: "info",
      title: "Restaurant Info",
      description: "Menu, reviews, contact details",
      icon: <Info className="w-8 h-8" />,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      iconBg: "bg-white/20 dark:bg-white/10",
      buttonBg: "bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 dark:text-blue-400",
      action: () => router.push("/restaurant-info"),
    },
    {
      id: "reservation",
      title: "Table Reservation",
      description: "Reserve your table in advance",
      icon: <Calendar className="w-8 h-8" />,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      iconBg: "bg-white/20 dark:bg-white/10",
      buttonBg: "bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 dark:text-purple-400",
      action: () => router.push("/restaurant-info/reservations"),
    },
  ]

  const adminServices = [
    {
      title: "Restaurant Dashboard",
      description: "Complete restaurant management system",
      icon: <Settings className="w-6 h-6" />,
      action: () => router.push("/dashboard"),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
          <svg className="absolute right-0 top-0 h-full w-32" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L100,0 L100,50 Q50,100 0,50 Z" className="text-primary/10" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-4">
            <img
              src="/hey-paytm-logo.png"
              alt="Hey Paytm logo"
              className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-lg"
            />
            {/* </CHANGE> */}
            <div>
              <h1 className="font-sans font-bold text-xl md:text-2xl text-foreground">Hey Paytm</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Voice Dining Experience</p>
            </div>
          </div>
          <Badge
            variant={restaurantInfo.isOpen ? "default" : "destructive"}
            className="shadow-sm text-xs md:text-sm px-2 py-0.5"
          >
            {restaurantInfo.isOpen ? "Open Now" : "Closed"}
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center mb-8 md:mb-12 relative">
          <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden mb-8">
            <img
              src="/indian-restaurant-interior.png"
              alt="Restaurant Interior"
              className="w-full h-80 md:h-96 lg:h-[28rem] object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
          </div>

          <div className="pt-8 md:pt-12 lg:pt-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-4 md:mb-6 text-balance">
              Welcome to {restaurantInfo.name}
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm md:text-base">{restaurantInfo.rating}</span>
                <span className="text-xs md:text-sm">({restaurantInfo.reviews} reviews)</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm">{restaurantInfo.openHours}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6 md:mb-8">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm">{restaurantInfo.address}</span>
            </div>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Button
                className="w-full sm:w-auto text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
                onClick={() => router.push("/restaurant-info/menu")}
              >
                Explore Menu
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-sm md:text-base px-4 md:px-6 py-2 md:py-3 bg-transparent"
                onClick={() => router.push("/restaurant-info/reservations")}
              >
                Reserve a Table
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="customer" className="space-y-6 md:space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-10 md:h-12">
            <TabsTrigger value="customer" className="text-xs md:text-sm">
              Customer Services
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-xs md:text-sm">
              Admin Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`min-h-44 md:min-h-48 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${service.color} relative overflow-hidden`}
                  onClick={service.action}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                      <circle cx="70" cy="30" r="30" />
                    </svg>
                  </div>
                  <CardContent className="p-5 md:p-6 relative z-10">
                    <div className="flex flex-col gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${service.iconBg} w-fit`}>{service.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base md:text-lg mb-2">{service.title}</h3>
                        <p className="text-xs md:text-sm opacity-80 mb-4">{service.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${service.buttonBg} shadow-sm text-xs md:text-sm border-current`}
                        >
                          Get Started
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Dine-In Table Selection */}
            {selectedService === "dine-in" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Utensils className="w-5 h-5 md:w-6 md:h-6" />
                    Select Your Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((tableNum) => (
                      <Button
                        key={tableNum}
                        variant="outline"
                        className="h-16 md:h-20 flex flex-col items-center justify-center bg-background hover:bg-primary/10"
                        onClick={() => router.push(`/table/${tableNum}`)}
                      >
                        <span className="font-bold text-sm md:text-base text-foreground">Table {tableNum}</span>
                        <span className="text-xs text-muted-foreground">Available</span>
                      </Button>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedService("")}>
                      Back to Services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="text-center hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                <CardContent className="p-5 md:p-6 relative z-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Menu className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm md:text-base mb-1">View Menu</h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">Browse our delicious offerings</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/restaurant-info/menu")}
                    className="bg-transparent hover:bg-primary/5 text-xs md:text-sm"
                  >
                    View Menu
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                <CardContent className="p-5 md:p-6 relative z-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Phone className="w-6 h-6 md:w-7 md:h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-sm md:text-base mb-1">Contact Us</h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">Get in touch with us</p>
                  <Button size="sm" variant="outline" className="bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 text-xs md:text-sm">
                    {restaurantInfo.phone}
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                <CardContent className="p-5 md:p-6 relative z-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <ChefHat className="w-6 h-6 md:w-7 md:h-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-medium text-sm md:text-base mb-2">Our Specialties</h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">Authentic Indian cuisine</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/restaurant-info")}
                    className="bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs md:text-sm"
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              {adminServices.map((service, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        {service.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base md:text-lg mb-1">{service.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3">{service.description}</p>
                        <Button onClick={service.action} className="w-full md:w-auto text-xs md:text-sm">
                          Access Dashboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 max-w-2xl mx-auto">
              <CardContent className="p-4 md:p-6">
                <h4 className="font-medium text-amber-800 dark:text-amber-400 mb-2 text-sm md:text-base">Admin Access</h4>
                <p className="text-xs md:text-sm text-amber-700 dark:text-amber-500">
                  The dashboard provides access to live orders, kitchen display, table management, staff management,
                  analytics, and menu management.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 md:mt-16 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 md:mb-8">Why Choose Hey Paytm?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Utensils className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <h4 className="font-medium text-sm md:text-base mb-2">Voice Ordering</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Revolutionary voice-powered ordering system for seamless dining experience
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-medium text-sm md:text-base mb-2">Self-Service Takeaway</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Order online, pay online, and pickup at your convenience
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Calendar className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-sm md:text-base mb-2">Easy Reservations</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Book your table in advance with our simple reservation system
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Truck className="w-7 h-7 md:w-8 md:h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="font-medium text-sm md:text-base mb-2">Home Delivery</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Order online and get delivered to your doorstep
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-16 space-y-10 md:space-y-12">
          <section aria-labelledby="specials-title">
            <h3 id="specials-title" className="text-xl md:text-2xl font-bold text-foreground mb-6 md:mb-8 text-center">
              Today&apos;s Specials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <img
                    src="/butter-chicken-platter.jpg"
                    alt="Butter Chicken platter"
                    className="w-full h-48 md:h-56 object-cover rounded-t-lg"
                  />
                  <div className="p-4 md:p-6">
                    <h4 className="font-semibold text-base md:text-lg mb-2">Butter Chicken</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Creamy tomato gravy with tender chicken, served with naan.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <img
                    src="/veg-biryani-in-handi.jpg"
                    alt="Veg Biryani in handi"
                    className="w-full h-48 md:h-56 object-cover rounded-t-lg"
                  />
                  <div className="p-4 md:p-6">
                    <h4 className="font-semibold text-base md:text-lg mb-2">Veg Biryani</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Fragrant basmati rice with seasonal veggies and spices.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <img
                    src="/paneer-tikka-grill.jpg"
                    alt="Paneer Tikka on grill"
                    className="w-full h-48 md:h-56 object-cover rounded-t-lg"
                  />
                  <div className="p-4 md:p-6">
                    <h4 className="font-semibold text-base md:text-lg mb-2">Paneer Tikka</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Char-grilled paneer with peppers and tangy marinade.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Dining Information */}
          <section aria-labelledby="info-title">
            <h3 id="info-title" className="text-xl md:text-2xl font-bold text-foreground mb-6 md:mb-8 text-center">
              Dining Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Operating Hours</CardTitle>
                </CardHeader>
                <CardContent className="text-xs md:text-sm text-muted-foreground">
                  <p>Monday–Sunday</p>
                  <p className="mt-1">11:00 AM – 11:00 PM</p>
                  <p className="mt-2 text-foreground">Last order by 10:30 PM</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Facilities</CardTitle>
                </CardHeader>
                <CardContent className="text-xs md:text-sm text-muted-foreground">
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Air-conditioned seating</li>
                    <li>Family-friendly tables</li>
                    <li>Contactless payments</li>
                    <li>Wheelchair accessible</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Payments Accepted</CardTitle>
                </CardHeader>
                <CardContent className="text-xs md:text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">UPI</Badge>
                    <Badge variant="outline">Credit/Debit</Badge>
                    <Badge variant="outline">Net Banking</Badge>
                    <Badge variant="outline">Wallets</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
