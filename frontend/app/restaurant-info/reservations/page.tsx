"use client"
import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CalendarIcon,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Star,
  Gift,
  Utensils,
  Calendar,
  Timer,
  User,
  Heart,
  Home
} from "lucide-react"
import { format, addDays, isToday, isTomorrow } from "date-fns"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"

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
  { size: 6, label: "Family", icon: "👨‍👩‍👧‍👦👶" },
  { size: 8, label: "Large", icon: "👥" },
  { size: 10, label: "Party", icon: "🎉" }
]

const OCCASIONS = [
  { name: "Birthday", icon: "🎂" },
  { name: "Anniversary", icon: "💕" },
  { name: "Date Night", icon: "💑" },
  { name: "Business Meeting", icon: "💼" },
  { name: "Family Dinner", icon: "👨‍👩‍👧‍👦" },
  { name: "Celebration", icon: "🎉" },
  { name: "Casual Dining", icon: "🍽️" },
  { name: "Other", icon: "✨" }
]

export default function ReservationsPage() {
  const router = useRouter()

  // Enhanced state management
  const [currentStep, setCurrentStep] = useState<ReservationStep>('datetime')
  const [isLoading, setIsLoading] = useState(false)

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
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi')
  const [upiId, setUpiId] = useState<string>('')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  // Reservation confirmation
  const [reservationId, setReservationId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Constants
  const currency = '₹'
  const taxPercent = 18
  const discount = 0

  // Computed values
  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return format(d, 'yyyy-MM-dd')
  }, [])

  const guests = useMemo(() => {
    return selectedTables.reduce((s, id) => {
      const t = availableTables.find((x) => x.id === id)
      return s + (t ? Number(t.capacity || 0) : 0)
    }, 0)
  }, [selectedTables, availableTables])

  const subtotal = selectedTables.reduce((s, id) => {
    const t = availableTables.find((x) => x.id === id)
    return s + (t ? Number(t.reservationPrice || 0) : 0)
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

        // Enhanced table data with mock features
        const enhancedTables = Array.isArray(data) ? data.map((d: any) => ({
          id: d.number ?? d.id,
          capacity: d.capacity ?? 0,
          reservationPrice: typeof d.reservationPrice !== 'undefined' ? Number(d.reservationPrice) : 100,
          location: d.location || (d.id <= 5 ? 'Window Side' : d.id <= 10 ? 'Garden View' : 'Main Hall'),
          features: d.features || (d.capacity >= 6 ? ['Large Table', 'Family Friendly'] : ['Intimate Setting'])
        })) : []

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
    const selectedDate = new Date(dateStr)
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
        return paymentMethod === 'upi' ? !!upiId.trim() : !!(cardDetails.number && cardDetails.expiry && cardDetails.cvv && cardDetails.name)
      default:
        return true
    }
  }

  const nextStep = () => {
    const steps: ReservationStep[] = ['datetime', 'tables', 'details', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: ReservationStep[] = ['datetime', 'tables', 'details', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const submitReservation = async () => {
    if (!validateStep('payment')) return

    setIsSubmitting(true)
    const payload = {
      customerName,
      phone,
      email,
      date,
      time,
      guests: partySize,
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
        paymentStatus: 'paid',
        method: paymentMethod
      }
    }

    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const res = await fetch(`${base}/api/reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const result = await res.json()
        setReservationId(result.id || 'RES' + Date.now())
        setCurrentStep('confirmation')
      } else {
        const error = await res.json().catch(() => ({}))
        alert(error.message || `Failed to create reservation (status ${res.status})`)
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enhanced step progress component with edit functionality
  const StepProgress = () => {
    const steps = [
      { key: 'datetime', label: 'Date & Time', icon: Calendar, shortLabel: 'Date' },
      { key: 'tables', label: 'Select Table', icon: Utensils, shortLabel: 'Table' },
      { key: 'details', label: 'Your Details', icon: User, shortLabel: 'Details' },
      { key: 'payment', label: 'Payment', icon: CreditCard, shortLabel: 'Payment' },
      { key: 'confirmation', label: 'Confirmation', icon: CheckCircle, shortLabel: 'Done' }
    ]

    const currentIndex = steps.findIndex(s => s.key === currentStep)

    const canNavigateToStep = (stepIndex: number) => {
      // Can navigate to completed steps or current step
      if (stepIndex <= currentIndex) return true

      // Can navigate to next step if current step is valid
      if (stepIndex === currentIndex + 1) {
        return validateStep(currentStep)
      }

      return false
    }

    const navigateToStep = (stepKey: ReservationStep, stepIndex: number) => {
      if (canNavigateToStep(stepIndex) && stepKey !== 'confirmation') {
        setCurrentStep(stepKey)
      }
    }

    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-sm border">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentIndex
            const isCompleted = index < currentIndex
            const isClickable = canNavigateToStep(index) && step.key !== 'confirmation'

            return (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  onClick={() => navigateToStep(step.key as ReservationStep, index)}
                  disabled={!isClickable}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${isCompleted ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' :
                    isActive ? 'bg-primary border-primary text-white' :
                      isClickable ? 'border-primary text-primary hover:bg-primary/10 cursor-pointer' :
                        'border-muted-foreground text-muted-foreground cursor-not-allowed'
                    } ${isClickable ? 'hover:scale-105' : ''}`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                <div className="ml-3 flex-1">
                  <div className={`text-xs font-medium ${isActive ? 'text-primary' :
                    isCompleted ? 'text-green-600' :
                      'text-muted-foreground'
                    }`}>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </div>
                  {isCompleted && (
                    <button
                      onClick={() => navigateToStep(step.key as ReservationStep, index)}
                      className="text-xs text-green-600 hover:text-green-700 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 transition-colors ${isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <InlineLoader text="Loading reservation system..." size="md" />
      </div>
    )
  }

  // Reservation Summary Component
  const ReservationSummary = () => {
    if (currentStep === 'datetime' || currentStep === 'confirmation') return null

    return (
      <Card className="sticky top-24 bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Reservation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {date && time && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-sm text-muted-foreground">Date & Time</div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-right">
                  <div>{getDateLabel(date)}</div>
                  <div>{to12Hour(time)}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('datetime')}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                >
                  <Calendar className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {partySize && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-sm text-muted-foreground">Party Size</div>
              <div className="text-sm font-medium">{partySize} {partySize === 1 ? 'person' : 'people'}</div>
            </div>
          )}

          {sessionMinutes && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-sm font-medium">{sessionMinutes} minutes</div>
            </div>
          )}

          {selectedTables.length > 0 && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-sm text-muted-foreground">Tables</div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{selectedTables.join(', ')}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('tables')}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                >
                  <Utensils className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {customerName && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{customerName}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('details')}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                >
                  <User className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {occasion && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-sm text-muted-foreground">Occasion</div>
              <div className="text-sm font-medium">{occasion}</div>
            </div>
          )}

          {subtotal > 0 && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Subtotal</div>
                <div className="text-sm font-medium">{currency}{subtotal}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">GST ({taxPercent}%)</div>
                <div className="text-sm font-medium">{currency}{taxAmount}</div>
              </div>
              {tip > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Tip</div>
                  <div className="text-sm font-medium">{currency}{tip}</div>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="font-semibold">Total</div>
                <div className="font-semibold text-lg text-primary">{currency}{total}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-md border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                  Reserve Your Table
                </h1>
                <p className="text-sm text-muted-foreground">Book your perfect dining experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 rounded-full px-3 py-1">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Spice Garden Restaurant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <StepProgress />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Main Content */}

            {/* Step 1: Date & Time Selection */}
            {currentStep === 'datetime' && (
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-orange-500/10 p-6 text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl mb-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    When would you like to dine?
                  </CardTitle>
                  <p className="text-muted-foreground">Select your preferred date, time, and party size</p>
                </div>
                <CardContent className="space-y-8 p-6 text-center">
                  {/* Edit Mode Indicator */}
                  {date && time && partySize && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Editing Date & Time</div>
                        <div className="text-sm text-blue-700">
                          Current: {getDateLabel(date)} at {to12Hour(time)} for {partySize} {partySize === 1 ? 'person' : 'people'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block flex items-center justify-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      Select Date
                    </Label>
                    <div className="grid grid-cols-2 sd:grid-cols-4 gap-3 max-w-4xl mx-auto">
                      {Array.from({ length: 7 }, (_, i) => {
                        const dateOption = format(addDays(new Date(), i + 1), 'yyyy-MM-dd')
                        const dateObj = addDays(new Date(), i + 1)
                        const isSelected = date === dateOption

                        return (
                          <Button
                            key={dateOption}
                            variant={isSelected ? "default" : "outline"}
                            className={`h-16 flex flex-col items-center justify-center ${isSelected ? 'bg-primary text-white' : ''}`}
                            onClick={() => setDate(dateOption)}
                          >
                            <div className="text-xs opacity-80">{format(dateObj, 'EEE')}</div>
                            <div className="font-semibold">{format(dateObj, 'MMM dd')}</div>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Party Size Selection */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block flex items-center justify-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Party Size
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
                      {PARTY_SIZES.map((party) => (
                        <Button
                          key={party.size}
                          variant={partySize === party.size ? "default" : "outline"}
                          className={`h-20 flex flex-col items-center justify-center p-2 min-w-0 ${partySize === party.size ? 'bg-primary text-white' : ''}`}
                          onClick={() => setPartySize(party.size)}
                        >
                          <div className="text-lg mb-1">{party.icon}</div>
                          <div className="text-xs mb-1 truncate w-full text-center px-1">{party.label}</div>
                          <div className="font-semibold text-xs whitespace-nowrap">{party.size} {party.size === 1 ? 'person' : 'people'}</div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {date && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                      <Label className="text-lg font-semibold mb-4 block flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Select Time
                      </Label>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
                        {TIME_OPTIONS.map((timeOption) => (
                          <Button
                            key={timeOption}
                            variant={time === timeOption ? "default" : "outline"}
                            size="sm"
                            className={time === timeOption ? 'bg-primary text-white' : ''}
                            onClick={() => setTime(timeOption)}
                          >
                            {to12Hour(timeOption)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Duration */}
                  {time && (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                      <Label className="text-lg font-semibold mb-4 block flex items-center justify-center gap-2">
                        <Timer className="w-5 h-5 text-primary" />
                        Dining Duration
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
                        {[60, 90, 120, 150, 180].map((duration) => (
                          <Button
                            key={duration}
                            variant={sessionMinutes === duration ? "default" : "outline"}
                            className={sessionMinutes === duration ? 'bg-primary text-white' : ''}
                            onClick={() => setSessionMinutes(duration)}
                          >
                            <Timer className="w-4 h-4 mr-2" />
                            {duration} min
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={nextStep}
                      disabled={!validateStep('datetime')}
                      className="px-8"
                    >
                      Find Tables
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Table Selection */}
            {currentStep === 'tables' && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Utensils className="w-6 h-6 text-primary" />
                    Choose Your Table
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {getDateLabel(date)} at {to12Hour(time)} for {partySize} {partySize === 1 ? 'person' : 'people'}
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingTables ? (
                    <div className="text-center py-8">
                      <InlineLoader text="Finding available tables..." size="md" />
                    </div>
                  ) : tablesError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                      <p className="text-destructive">{tablesError}</p>
                      <Button variant="outline" onClick={prevStep} className="mt-4">
                        Try Different Time
                      </Button>
                    </div>
                  ) : availableTables.length ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableTables.map((table) => {
                          const isSelected = selectedTables.includes(table.id)
                          return (
                            <Card
                              key={table.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                              onClick={() => {
                                setSelectedTables(prev =>
                                  prev.includes(table.id)
                                    ? prev.filter(id => id !== table.id)
                                    : [...prev, table.id]
                                )
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-semibold">Table {table.id}</h3>
                                      {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                                    </div>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Up to {table.capacity} people
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {table.location}
                                      </div>
                                      {table.features && (
                                        <div className="flex gap-1 mt-2">
                                          {table.features.map((feature, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {feature}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-lg">{currency}{table.reservationPrice}</div>
                                    <div className="text-xs text-muted-foreground">reservation fee</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>

                      {selectedTables.length > 0 && (
                        <div className="bg-primary/10 rounded-lg p-4 mt-6">
                          <h4 className="font-semibold mb-2">Selected Tables Summary</h4>
                          <div className="text-sm text-muted-foreground">
                            Tables: {selectedTables.join(', ')} •
                            Total Capacity: {guests} people •
                            Total Fee: {currency}{subtotal}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tables available for the selected time slot.</p>
                      <Button variant="outline" onClick={prevStep} className="mt-4">
                        Choose Different Time
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    <Button variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!validateStep('tables')}
                      className="px-8"
                    >
                      Continue
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Customer Details */}
            {currentStep === 'details' && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <User className="w-6 h-6 text-primary" />
                    Your Details
                  </CardTitle>
                  <p className="text-muted-foreground">Tell us about your reservation</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName" className="text-base font-medium">Full Name *</Label>
                      <Input
                        id="customerName"
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-base font-medium">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-base font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-medium">Occasion</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {OCCASIONS.map((occ) => (
                          <Button
                            key={occ.name}
                            variant={occasion === occ.name ? "default" : "outline"}
                            size="sm"
                            className={`justify-start ${occasion === occ.name ? 'bg-primary text-white' : ''}`}
                            onClick={() => setOccasion(occasion === occ.name ? '' : occ.name)}
                          >
                            <span className="mr-2">{occ.icon}</span>
                            {occ.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests" className="text-base font-medium">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special arrangements, dietary requirements, or requests..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Reservation Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Reservation Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Date & Time</div>
                        <div className="font-medium">{getDateLabel(date)} at {to12Hour(time)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-medium">{sessionMinutes} minutes</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Party Size</div>
                        <div className="font-medium">{partySize} {partySize === 1 ? 'person' : 'people'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tables</div>
                        <div className="font-medium">{selectedTables.join(', ')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!validateStep('details')}
                      className="px-8"
                    >
                      Proceed to Payment
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment */}
            {currentStep === 'payment' && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <CreditCard className="w-6 h-6 text-primary" />
                    Payment Details
                  </CardTitle>
                  <p className="text-muted-foreground">Complete your reservation</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bill Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-4">Bill Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Reservation Fee</span>
                        <span>{currency}{subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>GST ({taxPercent}%)</span>
                        <span>{currency}{taxAmount}</span>
                      </div>
                      {tip > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tip</span>
                          <span>{currency}{tip}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount</span>
                        <span>{currency}{total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tip Selection */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">Add Tip (Optional)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 50, 100, 150].map((amount) => (
                        <Button
                          key={amount}
                          variant={tip === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTip(amount)}
                          className={tip === amount ? 'bg-primary text-white' : ''}
                        >
                          {amount === 0 ? 'No Tip' : `${currency}${amount}`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={paymentMethod === 'upi' ? "default" : "outline"}
                        className={`h-16 ${paymentMethod === 'upi' ? 'bg-primary text-white' : ''}`}
                        onClick={() => setPaymentMethod('upi')}
                      >
                        <div className="text-center">
                          <div className="font-semibold">UPI Payment</div>
                          <div className="text-xs opacity-80">Quick & Secure</div>
                        </div>
                      </Button>
                      <Button
                        variant={paymentMethod === 'card' ? "default" : "outline"}
                        className={`h-16 ${paymentMethod === 'card' ? 'bg-primary text-white' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="text-center">
                          <div className="font-semibold">Card Payment</div>
                          <div className="text-xs opacity-80">Credit/Debit Card</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {paymentMethod === 'upi' ? (
                    <div>
                      <Label htmlFor="upiId" className="text-base font-medium">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber" className="text-base font-medium">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry" className="text-base font-medium">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv" className="text-base font-medium">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cardName" className="text-base font-medium">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          placeholder="Name on card"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={submitReservation}
                      disabled={!validateStep('payment') || isSubmitting}
                      className="px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <InlineLoader size="sm" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay {currency}{total}
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 'confirmation' && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <div className="mb-6">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-green-600 mb-2">Reservation Confirmed!</h2>
                    <p className="text-muted-foreground">Your table has been successfully reserved</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
                    <div className="text-sm text-muted-foreground mb-2">Reservation ID</div>
                    <div className="text-2xl font-bold text-green-600">{reservationId}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground">Date & Time</div>
                      <div className="font-semibold">{getDateLabel(date)} at {to12Hour(time)}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground">Party Size</div>
                      <div className="font-semibold">{partySize} {partySize === 1 ? 'person' : 'people'}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground">Tables</div>
                      <div className="font-semibold">{selectedTables.join(', ')}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground">Total Paid</div>
                      <div className="font-semibold">{currency}{total}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A confirmation SMS has been sent to {phone}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => router.push('/')} className="px-8">
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/restaurant-info/menu')}>
                        <Utensils className="w-4 h-4 mr-2" />
                        View Menu
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar with Reservation Summary */}
          <div className="lg:col-span-1">
            <ReservationSummary />
          </div>
        </div>
      </div>
    </div>
  )
}