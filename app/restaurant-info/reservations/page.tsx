"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Users, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface TimeSlot {
  time: string
  available: boolean
  tables: number
}

export default function ReservationsPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [partySize, setPartySize] = useState("")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    specialRequests: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationConfirmed, setReservationConfirmed] = useState(false)

  const timeSlots: TimeSlot[] = [
    { time: "11:00 AM", available: true, tables: 3 },
    { time: "11:30 AM", available: true, tables: 2 },
    { time: "12:00 PM", available: true, tables: 5 },
    { time: "12:30 PM", available: true, tables: 4 },
    { time: "1:00 PM", available: false, tables: 0 },
    { time: "1:30 PM", available: true, tables: 2 },
    { time: "2:00 PM", available: true, tables: 6 },
    { time: "2:30 PM", available: true, tables: 3 },
    { time: "7:00 PM", available: true, tables: 4 },
    { time: "7:30 PM", available: false, tables: 0 },
    { time: "8:00 PM", available: true, tables: 2 },
    { time: "8:30 PM", available: true, tables: 5 },
    { time: "9:00 PM", available: true, tables: 3 },
    { time: "9:30 PM", available: true, tables: 2 },
  ]

  const partySizes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime || !partySize || !customerInfo.name || !customerInfo.phone) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setReservationConfirmed(true)
    }, 2000)
  }

  if (reservationConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <h1 className="font-sans font-bold text-xl text-foreground">Reservation Confirmed</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Reservation Confirmed!</h2>
              <p className="text-green-700 mb-6">
                Your table has been reserved successfully. We look forward to serving you!
              </p>

              <div className="bg-white rounded-lg p-6 mb-6 text-left">
                <h3 className="font-bold text-lg mb-4">Reservation Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Date:</span> {selectedDate && format(selectedDate, "PPP")}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span> {selectedTime}
                  </p>
                  <p>
                    <span className="font-medium">Party Size:</span> {partySize}{" "}
                    {partySize === "1" ? "person" : "people"}
                  </p>
                  <p>
                    <span className="font-medium">Name:</span> {customerInfo.name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {customerInfo.phone}
                  </p>
                  <p>
                    <span className="font-medium">Reservation ID:</span> RSV
                    {Math.random().toString(36).substr(2, 6).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" onClick={() => router.push("/restaurant-info")}>
                  Back to Restaurant Info
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => router.push("/restaurant-info/menu")}
                >
                  View Menu
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Please arrive on time for your reservation</li>
                <li>• Call us if you need to modify or cancel</li>
                <li>• Tables are held for 15 minutes past reservation time</li>
                <li>• We'll send you a reminder SMS before your visit</li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-sans font-bold text-xl text-foreground">Reserve a Table</h1>
            <p className="text-sm text-muted-foreground">Spice Garden Restaurant</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Party Size */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Party Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={partySize} onValueChange={setPartySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of guests" />
                </SelectTrigger>
                <SelectContent>
                  {partySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} {size === "1" ? "person" : "people"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Time Selection */}
          {selectedDate && partySize && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Available Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <span className="font-medium">{slot.time}</span>
                      {slot.available ? (
                        <span className="text-xs text-muted-foreground">{slot.tables} tables available</span>
                      ) : (
                        <span className="text-xs text-red-500">Fully booked</span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          {selectedTime && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="requests"
                    placeholder="Any special requests or dietary requirements?"
                    value={customerInfo.specialRequests}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reservation Summary */}
          {selectedDate && selectedTime && partySize && customerInfo.name && customerInfo.phone && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Reservation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <span className="font-medium">Date:</span> {format(selectedDate, "PPP")}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {selectedTime}
                </p>
                <p>
                  <span className="font-medium">Party Size:</span> {partySize} {partySize === "1" ? "person" : "people"}
                </p>
                <p>
                  <span className="font-medium">Name:</span> {customerInfo.name}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {customerInfo.phone}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {selectedDate && selectedTime && partySize && customerInfo.name && customerInfo.phone && (
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting}>
              {isSubmitting ? "Confirming Reservation..." : "Confirm Reservation"}
            </Button>
          )}
        </form>

        {/* Important Information */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-2">Reservation Policy:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Reservations are held for 15 minutes past the reserved time</li>
                  <li>• Cancellations must be made at least 2 hours in advance</li>
                  <li>• Large parties (8+) may require a deposit</li>
                  <li>• We'll send you a confirmation SMS shortly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
