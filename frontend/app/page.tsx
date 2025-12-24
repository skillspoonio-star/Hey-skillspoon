"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  MessageCircle,
  Users,
  Award,
  Zap,
  Heart,
  TrendingUp,

  Send,
  X,
  ChevronLeft,

} from "lucide-react"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"
import { useToast, ToastContainer } from "@/components/ui/toast"

export default function HomePage() {
  const router = useRouter()
  const { success, error, info } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [showDineInDialog, setShowDineInDialog] = useState(false)

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [email, setEmail] = useState("")
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [liveStats, setLiveStats] = useState({
    activeOrders: 12,
    tablesOccupied: 8,
    totalTables: 15,
    avgWaitTime: "15 min"
  })

  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "",
    rating: 0,
    reviews: 0,
    address: "",
    phone: "",
    isOpen: true,
    openHours: "",
    interiorImage: "",
  })

  // Load restaurant info from API
  useEffect(() => {
    const loadRestaurantInfo = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const response = await fetch(`${base}/api/restaurant/info`)

        if (response.ok) {
          const data = await response.json()
          setRestaurantInfo({
            name: data.name || "Restaurant",
            rating: data.rating || 0,
            reviews: data.totalReviews || 0,
            address: data.address || "",
            phone: data.phone || "",
            isOpen: data.isOpen ?? true,
            openHours: data.openingHours ? formatOpeningHours(data.openingHours) : "",
            interiorImage: data.interiorImage || "",
          })
        }
      } catch (error) {
        console.error('Failed to load restaurant info:', error)
      }
    }

    loadRestaurantInfo()
  }, [])

  // Helper function to format opening hours
  const formatOpeningHours = (hours: any) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayHours = hours[today]
    if (todayHours && !todayHours.closed) {
      return `${todayHours.open} - ${todayHours.close}`
    }
    return "Closed"
  }



  const chefRecommendations = [
    {
      id: 1,
      name: "Signature Butter Chicken",
      description: "Chef's special recipe with 20+ spices",
      price: "₹399",
      image: "/chef-special-1.jpg",
      prepTime: "25 min",
      isVeg: false,
      rating: 4.8
    },
    {
      id: 2,
      name: "Royal Paneer Makhani",
      description: "Creamy paneer in rich tomato gravy",
      price: "₹349",
      image: "/chef-special-2.jpg",
      prepTime: "20 min",
      isVeg: true,
      rating: 4.7
    },
    {
      id: 3,
      name: "Hyderabadi Biryani",
      description: "Authentic dum-cooked basmati rice",
      price: "₹449",
      image: "/chef-special-3.jpg",
      prepTime: "35 min",
      isVeg: false,
      rating: 4.9
    }
  ]



  // Load restaurant info and simulate loading
  useEffect(() => {
    const loadRestaurantInfo = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const response = await fetch(`${base}/api/restaurant/info`)
        if (response.ok) {
          const data = await response.json()
          setRestaurantInfo({
            name: data.name,
            rating: data.rating,
            reviews: data.totalReviews,
            address: data.address,
            phone: data.phone,
            isOpen: data.isOpen,
            openHours: "11:00 AM - 11:00 PM", // You can format this from openingHours data
            interiorImage: data.interiorImage || "",
          })
        }
      } catch (error) {
        console.error('Failed to load restaurant info:', error)
      }
    }

    loadRestaurantInfo()
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            router.push('/restaurant-info/menu')
          }
          break
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            router.push('/restaurant-info/reservations')
          }
          break
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setChatOpen(true)
          }
          break
        case 'escape':
          setChatOpen(false)
          setShowKeyboardHelp(false)
          setShowDineInDialog(false)
          break
        case '?':
          if (e.shiftKey) {
            e.preventDefault()
            setShowKeyboardHelp(true)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router])

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    info("Scrolled to top", "Navigation")
  }

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        activeOrders: Math.max(5, Math.min(25, prev.activeOrders + Math.floor(Math.random() * 3) - 1)),
        tablesOccupied: Math.max(0, Math.min(15, prev.tablesOccupied + Math.floor(Math.random() * 3) - 1))
      }))
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Handle social media clicks with analytics
  const handleSocialClick = (platform: string, url: string) => {
    info(`Opening ${platform}...`, "Social Media")
    // In a real app, you'd track this analytics event
    window.open(url, '_blank')
  }

  // Handle phone call with confirmation
  const handlePhoneCall = () => {
    const confirmed = window.confirm(`Call ${restaurantInfo.name}?\n${restaurantInfo.phone}`)
    if (confirmed) {
      success("Opening phone dialer...", "Calling Restaurant")
      window.location.href = `tel:${restaurantInfo.phone}`
    }
  }



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <InlineLoader text="Loading restaurant..." size="md" />
      </div>
    )
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
      action: () => {
        setShowDineInDialog(true)
      },
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
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent animate-pulse"></div>
          <svg className="absolute right-0 top-0 h-full w-32" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L100,0 L100,50 Q50,100 0,50 Z" className="text-primary/10" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <img
                  src="/hey-paytm-logo.png"
                  alt="Hey Paytm logo"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-lg transition-transform hover:scale-105"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="font-sans font-bold text-xl md:text-2xl text-foreground">{restaurantInfo.name || "Restaurant"}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Voice Dining Experience</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={restaurantInfo.isOpen ? "default" : "destructive"}
                className="shadow-sm text-xs md:text-sm px-2 py-0.5 animate-pulse"
              >
                {restaurantInfo.isOpen ? "Open Now" : "Closed"}
              </Badge>
            </div>
          </div>

          {/* Live Stats Bar
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-background/50 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-lg font-bold text-primary">{liveStats.activeOrders}</div>
              <div className="text-xs text-muted-foreground">Active Orders</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-lg font-bold text-green-600">{liveStats.tablesOccupied}/{liveStats.totalTables}</div>
              <div className="text-xs text-muted-foreground">Tables</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-lg font-bold text-amber-600">{liveStats.avgWaitTime}</div>
              <div className="text-xs text-muted-foreground">Avg Wait</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-lg font-bold text-purple-600">{restaurantInfo.rating}★</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div> */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center mb-8 md:mb-12 relative">
          <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden mb-8">
            <img
              src={restaurantInfo.interiorImage || "/indian-restaurant-interior.png"}
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



        {/* Today's Special */}
        <div className="mb-8 md:mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Today's Special</h3>
            <p className="text-muted-foreground">Handpicked specialties by our master chef</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chefRecommendations.map((dish, index) => (
              <Card key={dish.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="relative overflow-hidden">
                  <img
                    src={dish.image || "/placeholder.svg"}
                    alt={dish.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={dish.isVeg ? "secondary" : "destructive"} className="text-xs">
                      {dish.isVeg ? "VEG" : "NON-VEG"}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/70 text-white">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {dish.rating}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Button
                        size="sm"
                        className="w-full bg-white text-black hover:bg-white/90"
                        onClick={() => {
                          // Navigate to menu with specific dish highlighted
                          info(`Redirecting to ${dish.name}`, "Chef's Special")
                          router.push(`/restaurant-info/menu?dish=${dish.id}`)
                        }}
                      >
                        Order Now • {dish.price}
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg mb-1">{dish.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{dish.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-primary">{dish.price}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {dish.prepTime}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              {services.map((service, index) => (
                <Card
                  key={service.id}
                  className={`min-h-44 md:min-h-48 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 ${service.color} relative overflow-hidden group`}
                  onClick={service.action}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                      <circle cx="70" cy="30" r="30" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-5 md:p-6 relative z-10">
                    <div className="flex flex-col gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${service.iconBg} w-fit group-hover:scale-110 transition-transform duration-300`}>
                        {service.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base md:text-lg mb-2 group-hover:text-foreground transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-xs md:text-sm opacity-80 mb-4 group-hover:opacity-100 transition-opacity">
                          {service.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${service.buttonBg} shadow-sm text-xs md:text-sm border-current group-hover:shadow-lg transition-all duration-300`}
                          onClick={(e) => {
                            e.stopPropagation()
                            service.action()
                          }}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Get Started
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 text-xs md:text-sm"
                    onClick={handlePhoneCall}
                  >
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
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Why Choose Hey Paytm?</h3>
          <p className="text-muted-foreground mb-8">Experience the future of dining with our innovative features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <Utensils className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h4 className="font-semibold text-base md:text-lg mb-2 group-hover:text-primary transition-colors">Voice Ordering</h4>
              <p className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors">
                Revolutionary voice-powered ordering system for seamless dining experience
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-200 to-green-100 dark:from-green-900/40 dark:to-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-base md:text-lg mb-2 group-hover:text-green-600 transition-colors">Self-Service Takeaway</h4>
              <p className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors">
                Order online, pay online, and pickup at your convenience
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-200 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-base md:text-lg mb-2 group-hover:text-blue-600 transition-colors">Easy Reservations</h4>
              <p className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors">
                Book your table in advance with our simple reservation system
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <Truck className="w-8 h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="font-semibold text-base md:text-lg mb-2 group-hover:text-amber-600 transition-colors">Home Delivery</h4>
              <p className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors">
                Order online and get delivered to your doorstep
              </p>
            </div>
          </div>
        </div>



        {/* Social Media & Newsletter */}
        <div className="mt-16 md:mt-20 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Stay Connected</h3>
              <p className="text-muted-foreground mb-6">Follow us for updates, offers, and delicious content!</p>

              <div className="flex justify-center gap-4 mb-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleSocialClick('Instagram', 'https://instagram.com/spicegardenrestaurant')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleSocialClick('Facebook', 'https://facebook.com/spicegardenrestaurant')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleSocialClick('Twitter', 'https://twitter.com/spicegardenrest')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              </div>

              {/* <div className="max-w-md mx-auto">
                <h4 className="font-semibold mb-3">Get Exclusive Offers</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter your email" 
                    className="flex-1"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (email && email.includes('@')) {
                        // Handle newsletter subscription
                        success(`Thank you! We'll send updates to ${email}`, "Newsletter Subscription")
                        setEmail("")
                      } else {
                        error('Please enter a valid email address', "Invalid Email")
                      }
                    }}
                    disabled={!email.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Subscribe to get special offers and updates directly in your inbox
                </p>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 animate-pulse"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Chat Support
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">👋 Hi! How can we help you today?</p>
                <p className="text-xs text-muted-foreground mt-1">We typically reply within minutes</p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => {
                    setChatOpen(false)
                    router.push("/restaurant-info/menu")
                  }}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Menu Information
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => {
                    setChatOpen(false)
                    router.push("/restaurant-info/reservations")
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Table Reservation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => {
                    setChatOpen(false)
                    router.push("/delivery")
                  }}
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Delivery Status
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-message">Send a message</Label>
                <Textarea
                  id="chat-message"
                  placeholder="Type your message here..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  rows={3}
                />
                <Button
                  className="w-full"
                  disabled={!chatMessage.trim()}
                  onClick={() => {
                    if (chatMessage.trim()) {
                      // Handle chat message sending
                      success("We'll get back to you soon!", "Message Sent")
                      setChatMessage("")
                      setChatOpen(false)
                    }
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-background border-2"
            onClick={scrollToTop}
            title="Scroll to top"
          >
            <ChevronLeft className="w-4 h-4 rotate-90" />
          </Button>
        )}

        {/* Help Button */}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-background border-2"
          onClick={() => setShowKeyboardHelp(true)}
          title="Keyboard shortcuts (Shift + ?)"
        >
          <span className="text-lg font-bold">?</span>
        </Button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Menu</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+M</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reservations</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chat</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+C</kbd>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Close</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Help</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Press these key combinations to quickly navigate the restaurant
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <ToastContainer />

      {/* Dine-In Not Available Dialog */}
      <Dialog open={showDineInDialog} onOpenChange={setShowDineInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Utensils className="w-5 h-5 text-primary" />
              Dine-In Service
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                <strong>Currently Not Available</strong>
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Our dine-in table service is temporarily unavailable. Please try our other convenient options:
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  setShowDineInDialog(false)
                  router.push("/takeaway")
                }}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Self-Order Takeaway
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  setShowDineInDialog(false)
                  router.push("/delivery")
                }}
              >
                <Truck className="w-4 h-4 mr-2" />
                Online Home Delivery
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  setShowDineInDialog(false)
                  router.push("/restaurant-info/reservations")
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Reserve a Table
              </Button>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground text-center">
                We apologize for any inconvenience. Thank you for your understanding!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
