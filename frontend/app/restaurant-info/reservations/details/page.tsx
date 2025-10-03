"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function ReservationDetailsPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [guests, setGuests] = useState("")
  const [occasion, setOccasion] = useState("")
  const [seating, setSeating] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [special, setSpecial] = useState("")
  const [depositAgree, setDepositAgree] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const timeSlots = [
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
    "9:30 PM",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !guests || !name || !phone) return
    setIsSubmitting(true)

    const payload = {
      date: date.toISOString(),
      time,
      guests,
      occasion,
      seating,
      name,
      phone,
      email,
      special,
      id: "RSV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    }

    // Store locally for confirmation page
    if (typeof window !== "undefined") {
      localStorage.setItem("latestReservation", JSON.stringify(payload))
    }

    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/restaurant-info/reservations/confirmation")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Table Reservation - Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start bg-transparent", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Time *</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Guests *</Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select guests" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Occasion</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="business">Business Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seating Preference</Label>
                  <Select value={seating} onValueChange={setSeating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="window">Window</SelectItem>
                      <SelectItem value="quiet">Quiet Area</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9xxxxxxxxx"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div>
                <Label>Special Requests</Label>
                <Textarea
                  rows={3}
                  value={special}
                  onChange={(e) => setSpecial(e.target.value)}
                  placeholder="Allergies, celebrations, or other requests..."
                />
              </div>

              <div className="text-sm text-muted-foreground">
                For large parties (8+), a refundable deposit may be required. Please confirm below.
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="deposit"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={depositAgree}
                  onChange={(e) => setDepositAgree(e.target.checked)}
                />
                <Label htmlFor="deposit">I agree to pay a deposit if required.</Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!date || !time || !guests || !name || !phone || isSubmitting || !depositAgree}
              >
                {isSubmitting ? "Submitting..." : "Submit Reservation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
