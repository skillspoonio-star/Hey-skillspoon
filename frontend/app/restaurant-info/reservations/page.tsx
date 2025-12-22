"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  Users,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Utensils,
  Calendar,
  User,
  Star
} from "lucide-react"
import { format, addDays, isToday, isTomorrow, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"
import { useToast } from "@/components/providers/toast-provider"

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

type Table = {
  id: number;
  capacity: number;
  reservationPrice?: number;
  location?: string;
  features?: string[];
}

type ReservationStep = 'datetime' | 'tables' | 'details' | 'payment' | 'confirmation'

const TIME_OPTIONS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
]

const PARTY_SIZES = [
  { size: 1, label: "Solo", icon: "👤" },
  { size: 2, label: "Couple", icon: "👫" },
  { size: 4, label: "Small", icon: "👨‍👩‍👧‍👦" },
  { size: 6, label: "Family", icon: "👶👨‍👩‍👧‍👦" },
  { size: 8, label: "Large", icon: "👨‍👩‍👧‍👦" },
  { size: 10, label: "Party", icon: "🎉" }
]

const OCCASIONS = [
  { name: "Birthday", icon: "🎂" },
  { name: "Anniversary", icon: "💕" },
  { name: "Date Night", icon: "🌹" },
  { name: "Business Meeting", icon: "�" },
  { name: "Family Dinner", icon: "👨‍👩‍👧‍👦" },
  { name: "Celebration", icon: "🎉" },
  { name: "Casual Dining", icon: "🍽️" },
  { name: "Other", icon: "✨" }
]

export default function ReservationsPage() {
  const router = useRouter()
  const { success, error, info, warning } = useToast()

  // Real-time state
  const [currentTime, setCurrentTime] = useState(new Date())
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    rating: 0,
    reviews: 0,
    cuisine: "",
    isOpen: true
  })

  // Enhanced state management
  const [currentStep, setCurrentStep] = useState<ReservationStep>('datetime')
  const [isLoading, setIsLoading] = useState(true)

  // Date and time state
  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState<string>("")
  const [partySize, setPartySize] = useState<number>(2)
  const [sessionMinutes, setSessionMinutes] = useState<number>(90)

  // Tables state
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [selectedTables, setSelectedTables] = useState<number[]>([])

  // Customer details
  const [customerName, setCustomerName] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [occasion, setOccasion] = useState<string>("")
  const [specialRequests, setSpecialRequests] = useState<string>("")

  // Payment state
  const [tip, setTip] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi')
  const [upiId, setUpiId] = useState<string>('')

  // Reservation confirmation
  const [reservationId, setReservationId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Constants
  const currency = '₹'
  const taxPercent = 18
  const discount = 0

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load restaurant info
  useEffect(() => {
    const loadRestaurantInfo = async () => {
      try {
        setIsLoading(true)
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const response = await fetch(`${base}/api/restaurant/info`)

        if (response.ok) {
          const data = await response.json()
          setRestaurantInfo({
            name: data.name || "Restaurant",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            rating: data.rating || 0,
            reviews: data.totalReviews || 0,
            cuisine: data.cuisine ? data.cuisine.join(" • ") : "",
            isOpen: data.isOpen ?? true
          })
        }
      } catch (error) {
        console.error('Failed to load restaurant info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRestaurantInfo()
  }, [])

  // Computed values
  const guests = selectedTables.reduce((s, id) => {
    const t = availableTables.find((x) => x.id === id)
    return s + (t ? Number(t.capacity || 0) : 0)
  }, 0)

  const subtotal = selectedTables.reduce((s, id) => {
    const t = availableTables.find((x) => x.id === id)
    return s + (t ? Number(t.reservationPrice || 100) : 100)
  }, 0)

  const taxAmount = Math.round((subtotal * taxPercent) / 100)
  const total = subtotal + taxAmount + tip - discount

  // Fetch available tables
  useEffect(() => {
    let mounted = true
    const fetchAvailableTables = async () => {
      if (!date || !time) return
      setLoadingTables(true)
      setTablesError(null)
      try {
        const q = new URLSearchParams({
          date,
          time,
          duration: String(sessionMinutes),
          partySize: String(partySize)
        })
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/tables/available?${q.toString()}`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        if (!mounted) return

        // Enhanced table data with proper pricing
        const enhancedTables = Array.isArray(data) ? data.map((d: any) => {
          const tableId = d.number ?? d.id
          const capacity = d.capacity ?? 2

          // Calculate reservation price based on table capacity and location
          let basePrice = 100

          if (capacity <= 2) basePrice = 120
          else if (capacity <= 4) basePrice = 180
          else if (capacity <= 6) basePrice = 250
          else basePrice = 320

          const location = d.location || (tableId <= 5 ? 'Window Side' : tableId <= 10 ? 'Garden View' : 'Main Hall')
          if (location === 'Window Side') basePrice += 80
          else if (location === 'Garden View') basePrice += 50

          const variation = (tableId % 3) * 20
          basePrice += variation

          const finalPrice = (typeof d.reservationPrice !== 'undefined' && d.reservationPrice > 0)
            ? Math.max(Number(d.reservationPrice), 100)
            : basePrice

          return {
            id: tableId,
            capacity,
            reservationPrice: finalPrice,
            location,
            features: d.features || (capacity >= 6 ? ['Large Table', 'Family Friendly'] : ['Intimate Setting', 'Cozy'])
          }
        }) : []

        setAvailableTables(enhancedTables)
      } catch (err: any) {
        if (!mounted) return
        setTablesError(err?.message || 'Failed to fetch tables')
        setAvailableTables([])
      } finally {
        if (mounted) setLoadingTables(false)
      }
    }
    fetchAvailableTables()
    return () => { mounted = false }
  }, [date, time, sessionMinutes, partySize])

  // Helper functions
  const to12Hour = (hhmm: string) => {
    const [hh, mm] = hhmm.split(':').map(Number)
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm
    const period = hh >= 12 ? 'PM' : 'AM'
    const h12 = hh % 12 === 0 ? 12 : hh % 12
    return `${h12}:${String(mm).padStart(2, '0')} ${period}`
  }

  const getDateLabel = (dateStr: string) => {
    const selectedDate = parseISO(dateStr)
    if (isToday(selectedDate)) return 'Today'
    if (isTomorrow(selectedDate)) return 'Tomorrow'
    return format(selectedDate, 'MMM dd, yyyy')
  }

  const validateStep = (step: ReservationStep): boolean => {
    switch (step) {
      case 'datetime':
        return !!(date && time && partySize)
      case 'tables':
        return selectedTables.length > 0
      case 'details':
        return !!(customerName.trim() && phone.trim() && /^\d{10}$/.test(phone))
      case 'payment':
        return paymentMethod === 'upi' ? !!upiId.trim() : true // Cash payment doesn't need validation
      default:
        return true
    }
  }

  const nextStep = () => {
    const steps: ReservationStep[] = ['datetime', 'tables', 'details', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep(steps[currentIndex + 1])
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    const steps: ReservationStep[] = ['datetime', 'tables', 'details', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
      // Scroll to top when moving to previous step
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const submitReservation = async () => {
    if (!validateStep('payment')) return

    setIsSubmitting(true)

    try {
      // Handle cash payment differently - skip Razorpay
      if (paymentMethod === 'cash') {
        // Create reservation directly for cash payment
        const payload = {
          customerName,
          phone,
          email,
          date,
          time,
          guests: guests,
          tableNumbers: selectedTables,
          sessionMinutes,
          occasion: occasion || null,
          specialRequests: specialRequests || null,
          payment: {
            subtotal,
            tax: taxAmount,
            discount,
            extraCharge: tip,
            total,
            currency,
            paymentStatus: 'pending' // Cash payment is pending until arrival
          }
        }

        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const reservationResponse = await fetch(`${base}/api/reservation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (reservationResponse.ok) {
          const result = await reservationResponse.json()
          setReservationId(result.id || 'RES' + Date.now())
          success('Reservation confirmed! You can pay when you arrive at the restaurant.', 'Reservation Confirmed')
          setCurrentStep('confirmation')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          const errorData = await reservationResponse.json().catch(() => ({}))
          error(errorData.message || 'Failed to create reservation. Please try again.', 'Reservation Error')
        }
        setIsSubmitting(false)
        return
      }

      // Handle UPI payment with Razorpay
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const orderResponse = await fetch(`${base}/api/razorpay/create-reservation-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal,
          tax: taxAmount,
          tip,
          discount,
          customerName,
          tableNumbers: selectedTables,
          date,
          time
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}))
        error(errorData.message || 'Failed to create payment order. Please try again.', 'Payment Error')
        setIsSubmitting(false)
        return
      }

      const orderData = await orderResponse.json()

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: restaurantInfo.name || 'Restaurant',
        description: `Table Reservation - ${selectedTables.join(', ')}`,
        order_id: orderData.order.id,
        prefill: {
          name: customerName,
          email: email,
          contact: phone
        },
        theme: {
          color: '#f59e0b'
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${base}/api/razorpay/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }),
            })

            if (!verifyResponse.ok) {
              error('Payment verification failed. Please try again.', 'Payment Error')
              setIsSubmitting(false)
              return
            }

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              // Create reservation after successful payment
              const payload = {
                customerName,
                phone,
                email,
                date,
                time,
                guests: guests,
                tableNumbers: selectedTables,
                sessionMinutes,
                occasion: occasion || null,
                specialRequests: specialRequests || null,
                payment: {
                  subtotal,
                  tax: taxAmount,
                  discount,
                  extraCharge: tip,
                  total,
                  currency,
                  paymentStatus: 'paid'
                }
              }

              const reservationResponse = await fetch(`${base}/api/reservation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })

              if (reservationResponse.ok) {
                const result = await reservationResponse.json()
                setReservationId(result.id || 'RES' + Date.now())
                success('Payment successful! Your table has been reserved.', 'Reservation Confirmed')
                setCurrentStep('confirmation')
                window.scrollTo({ top: 0, behavior: 'smooth' })
                setIsSubmitting(false)
              } else {
                const errorData = await reservationResponse.json().catch(() => ({}))
                error(errorData.message || 'Failed to create reservation after payment. Please contact support.', 'Reservation Error')
                setIsSubmitting(false)
              }
            } else {
              error('Payment verification failed. Please try again.', 'Payment Error')
              setIsSubmitting(false)
            }
          } catch (err: any) {
            console.error('Payment verification error:', err)
            error('Payment verification failed due to network error. Please try again.', 'Network Error')
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: function () {
            // Handle payment cancellation
            error('Payment was cancelled. You can retry payment or choose to pay at the restaurant.', 'Payment Cancelled')
            setIsSubmitting(false)
          }
        }
      }

      // Load Razorpay script if not already loaded
      if (typeof window !== 'undefined' && !window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => {
          const rzp = new window.Razorpay(options)
          rzp.open()
        }
        script.onerror = () => {
          error('Failed to load payment gateway. Please try again or choose cash payment.', 'Payment Gateway Error')
          setIsSubmitting(false)
        }
        document.body.appendChild(script)
      } else {
        const rzp = new window.Razorpay(options)
        rzp.open()
      }

    } catch (err: any) {
      console.error(err)
      error(err?.message || 'Network error occurred. Please check your connection and try again.', 'Network Error')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <InlineLoader text="Loading reservation system..." size="md" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="absolute right-0 top-0 h-full w-24" viewBox="0 0 100 100" fill="currentColor">
            <path d="M20,20 Q80,20 80,80 Q20,80 20,20" className="text-amber-500" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Back</span>
            </Button>
            <h1 className="font-sans font-bold text-lg md:text-xl text-foreground">Reserve Your Table</h1>
          </div>
          <Badge variant={restaurantInfo.isOpen ? "default" : "destructive"} className="shadow-sm text-sm md:text-base">
            {restaurantInfo.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Restaurant Info Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 md:mb-3">
                  {restaurantInfo.name}
                </h2>
                {restaurantInfo.rating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-sm md:text-base">{restaurantInfo.rating}</span>
                    </div>
                    <span className="text-sm md:text-base text-muted-foreground">({restaurantInfo.reviews} reviews)</span>
                  </div>
                )}
                {restaurantInfo.cuisine && (
                  <p className="text-sm md:text-base text-muted-foreground">{restaurantInfo.cuisine}</p>
                )}
              </div>

              <div className="space-y-2 md:space-y-3">
                {restaurantInfo.address && (
                  <div className="flex items-center gap-2 text-sm md:text-base">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{restaurantInfo.address}</span>
                  </div>
                )}
                {restaurantInfo.phone && (
                  <div className="flex items-center gap-2 text-sm md:text-base">
                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{restaurantInfo.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Current time: {format(currentTime, 'h:mm:ss a • MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Progress */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-amber-500/5 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <Utensils className="w-16 h-16 md:w-20 md:h-20 text-primary" />
          </div>
          <CardContent className="p-4 md:p-6 relative z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-lg md:text-xl font-bold text-amber-600">
                  {['datetime', 'tables', 'details', 'payment', 'confirmation'].indexOf(currentStep) + 1}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-base md:text-lg text-foreground">
                  Step {['datetime', 'tables', 'details', 'payment', 'confirmation'].indexOf(currentStep) + 1} of 5
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  {currentStep === 'datetime' && 'Choose Date & Time'}
                  {currentStep === 'tables' && 'Select Table'}
                  {currentStep === 'details' && 'Your Details'}
                  {currentStep === 'payment' && 'Payment'}
                  {currentStep === 'confirmation' && 'Confirmed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 'datetime' && (
          <div className="space-y-6">
            {/* Reserve Your Spot Message */}
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="p-4 md:p-6">
                <div className="text-center">
                  <h3 className="text-lg md:text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    🍽️ Reserve Your Spot
                  </h3>
                  <p className="text-sm md:text-base text-amber-700 dark:text-amber-300">
                    Choose your preferred date and time for dining with us
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <Calendar className="w-full h-full text-primary" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dateOption = format(addDays(new Date(), i), 'yyyy-MM-dd')
                    const dateLabel = getDateLabel(dateOption)
                    const dayName = format(addDays(new Date(), i), 'EEE')

                    return (
                      <Button
                        key={dateOption}
                        variant={date === dateOption ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDate(dateOption)}
                        className={`flex flex-col h-auto p-3 text-xs md:text-sm transition-all ${date === dateOption ? "shadow-md scale-105" : "hover:scale-105"
                          }`}
                      >
                        <span className="font-medium">{dayName}</span>
                        <span className="text-xs opacity-80">{dateLabel}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <Clock className="w-full h-full text-primary" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Select Time
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
                  {TIME_OPTIONS.map((timeOption) => (
                    <Button
                      key={timeOption}
                      variant={time === timeOption ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTime(timeOption)}
                      className={`text-xs md:text-sm transition-all ${time === timeOption ? "shadow-md scale-105" : "hover:scale-105"
                        }`}
                    >
                      {to12Hour(timeOption)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Party Size Selection */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <Users className="w-full h-full text-primary" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Party Size
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                  {PARTY_SIZES.map((party) => (
                    <Button
                      key={party.size}
                      variant={partySize === party.size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPartySize(party.size)}
                      className={`flex flex-col h-auto p-3 text-xs md:text-sm transition-all ${partySize === party.size ? "shadow-md scale-105" : "hover:scale-105"
                        }`}
                    >
                      <span className="text-lg mb-1">{party.icon}</span>
                      <span className="font-medium">{party.size}</span>
                      <span className="text-xs opacity-80">{party.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button
                onClick={nextStep}
                disabled={!validateStep('datetime')}
                className="h-12 md:h-14 px-8 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                Continue to Tables
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'tables' && (
          <div className="space-y-6">
            {/* Table Selection */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <Utensils className="w-full h-full text-primary" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Utensils className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Available Tables
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {loadingTables ? (
                  <div className="text-center py-8">
                    <InlineLoader text="Finding available tables..." size="md" />
                  </div>
                ) : tablesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive">{tablesError}</p>
                  </div>
                ) : availableTables.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tables available for selected time</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {availableTables.map((table) => (
                      <Card
                        key={table.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedTables.includes(table.id)
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-muted/50"
                          }`}
                        onClick={() => {
                          if (selectedTables.includes(table.id)) {
                            setSelectedTables(selectedTables.filter(id => id !== table.id))
                          } else {
                            setSelectedTables([...selectedTables, table.id])
                          }
                        }}
                      >
                        <CardContent className="p-2 md:p-4">
                          {/* Desktop View */}
                          <div className="hidden md:block">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">Table {table.id}</h3>
                              <Badge variant="secondary">{table.capacity} seats</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{table.location}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {table.features?.map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-lg">{currency}{table.reservationPrice}</span>
                              <CheckCircle className={`w-5 h-5 ${selectedTables.includes(table.id) ? "text-primary" : "text-muted-foreground"
                                }`} />
                            </div>
                          </div>

                          {/* Mobile View - Compact 3-column layout */}
                          <div className="md:hidden text-center">
                            <h3 className="font-semibold text-sm mb-1">T{table.id}</h3>
                            <p className="text-xs text-muted-foreground mb-1">{table.capacity}p</p>
                            <p className="font-medium text-sm">{currency}{table.reservationPrice}</p>
                            <CheckCircle className={`w-4 h-4 mx-auto mt-1 ${selectedTables.includes(table.id) ? "text-primary" : "text-muted-foreground"
                              }`} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {selectedTables.length > 0 && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-amber-500/5">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-base md:text-lg">Selected Tables</h3>
                      <p className="text-sm text-muted-foreground">
                        Tables: {selectedTables.join(', ')} • {guests} guests • {currency}{subtotal}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="h-12 md:h-14 px-8">
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!validateStep('tables')}
                className="h-12 md:h-14 px-8 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                Continue to Details
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'details' && (
          <div className="space-y-6">
            {/* Customer Details Form */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <User className="w-full h-full text-primary" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit phone number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select an occasion (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCASIONS.map((occ) => (
                        <SelectItem key={occ.name} value={occ.name}>
                          <div className="flex items-center gap-2">
                            <span>{occ.icon}</span>
                            <span>{occ.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requests">Special Requests</Label>
                  <Textarea
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special dietary requirements or requests..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="h-12 md:h-14 px-8">
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!validateStep('details')}
                className="h-12 md:h-14 px-8 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-amber-500/5">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Reservation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm md:text-base">
                  <span>Date & Time:</span>
                  <span className="font-medium">{getDateLabel(date)} at {to12Hour(time)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Tables:</span>
                  <span className="font-medium">{selectedTables.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Guests:</span>
                  <span className="font-medium">{guests} people</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Subtotal:</span>
                  <span>{currency}{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Tax ({taxPercent}%):</span>
                  <span>{currency}{taxAmount}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Tip:</span>
                    <span>{currency}{tip}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-base md:text-lg">
                  <span>Total:</span>
                  <span>{currency}{total}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <CreditCard className="w-full h-full text-primary" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${paymentMethod === 'upi' ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">📱</span>
                      </div>
                      <h3 className="font-medium">UPI Payment</h3>
                      <p className="text-sm text-muted-foreground">Pay online via Razorpay</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${paymentMethod === 'cash' ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">💵</span>
                      </div>
                      <h3 className="font-medium">Pay with Cash</h3>
                      <p className="text-sm text-muted-foreground">Pay at restaurant</p>
                    </CardContent>
                  </Card>
                </div>

                {paymentMethod === 'upi' && (
                  <div>
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input
                      id="upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="your-upi@paytm"
                      className="mt-1"
                    />
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You can pay the reservation amount when you arrive at the restaurant.
                      Your table will be reserved and marked as pending payment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="h-12 md:h-14 px-8">
                Back
              </Button>
              <Button
                onClick={submitReservation}
                disabled={!validateStep('payment') || isSubmitting}
                className="h-12 md:h-14 px-8 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                {isSubmitting ? (
                  <InlineLoader text={paymentMethod === 'upi' ? "Processing Payment..." : "Confirming Reservation..."} size="sm" />
                ) : (
                  paymentMethod === 'upi' ? "Pay Now" : "Confirm Reservation"
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'confirmation' && (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="p-6 md:p-8 text-center">
                <CheckCircle className="w-16 h-16 md:w-20 md:h-20 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
                  Reservation Confirmed!
                </h2>
                <p className="text-green-700 dark:text-green-300 text-base md:text-lg">
                  Your table has been successfully reserved
                </p>
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Reservation ID: {reservationId}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reservation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Reservation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm md:text-base">
                  <span>Restaurant:</span>
                  <span className="font-medium">{restaurantInfo.name}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Date & Time:</span>
                  <span className="font-medium">{getDateLabel(date)} at {to12Hour(time)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Tables:</span>
                  <span className="font-medium">{selectedTables.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Guests:</span>
                  <span className="font-medium">{guests} people</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Phone:</span>
                  <span className="font-medium">{phone}</span>
                </div>
                {occasion && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Occasion:</span>
                    <span className="font-medium">{occasion}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-base md:text-lg">
                  <span>Total Paid:</span>
                  <span>{currency}{total}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Payment Status:</span>
                  <Badge variant={paymentMethod === 'upi' ? "default" : "secondary"}>
                    {paymentMethod === 'upi' ? "Paid Online" : "Pay at Restaurant"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Important Instructions */}
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4 md:p-6">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 text-base md:text-lg">
                  Important Instructions:
                </h4>
                <ul className="text-sm md:text-base text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Please arrive 10 minutes before your reservation time</li>
                  <li>• Show this confirmation at the reception</li>
                  <li>• Contact us if you need to modify or cancel</li>
                  {paymentMethod === 'cash' && <li>• Please bring exact change for payment</li>}
                  <li>• Table will be held for 15 minutes past reservation time</li>
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full h-12 md:h-14 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => router.push('/')}
              >
                Back to Home
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 md:h-14 text-base md:text-lg"
                onClick={() => router.push('/restaurant-info')}
              >
                View Restaurant Info
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}