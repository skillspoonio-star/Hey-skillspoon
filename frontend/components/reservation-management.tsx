"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Clock, Phone, Users, CheckCircle, Eye, Edit, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/providers/toast-provider"



// Generate time slots dynamically
const generateTimeSlots = () => {
  const slots = []
  const startHour = 11 // 11 AM
  const endHour = 23 // 11 PM

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`

      slots.push({ value: time24, label: time12 })
    }
  }
  return slots
}

interface Reservation {
  id: string
  customerName: string
  phone: string
  email: string
  date: string
  time: string
  guests: number
  tableNumber?: number
  tableNumbers?: number[]
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show"
  specialRequests?: string
  occasion?: string
  createdAt: string
  notes?: string
}

export function ReservationManagement() {
  const { success, error, warning } = useToast()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [tableFilter, setTableFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // new-reservation state for the Add Reservation dialog
  const [newDate, setNewDate] = useState<string>('')
  const [newTime, setNewTime] = useState<string>('')
  const [availableTables, setAvailableTables] = useState<any[]>([])
  const [selectedTables, setSelectedTables] = useState<number[]>([])
  const [newCustomerName, setNewCustomerName] = useState<string>('')
  const [newPhone, setNewPhone] = useState<string>('')
  const [newEmail, setNewEmail] = useState<string>('')
  const [newSpecialRequests, setNewSpecialRequests] = useState<string>('')
  const [creating, setCreating] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [selectedReservationDetail, setSelectedReservationDetail] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const fetchReservations = async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const res = await fetch(`${API_BASE}/api/reservation`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      // Map backend reservation shape to front-end Reservation interface
      const mapped = (Array.isArray(data) ? data : []).map((r: any) => {
        // compute createdAt safely: prefer r.createdAt; if missing and _id looks like ObjectId, extract timestamp
        let createdAt = ''
        if (r.createdAt) createdAt = r.createdAt
        else if (r._id && typeof r._id === 'string' && /^[0-9a-fA-F]{24}$/.test(r._id)) {
          try {
            const ts = parseInt(r._id.substring(0, 8), 16) * 1000
            const d = new Date(ts)
            if (!isNaN(d.getTime())) createdAt = d.toISOString()
          } catch (e) {
            createdAt = ''
          }
        }
        return {
          id: r.id || r._id || '',
          customerName: r.customerName || '',
          phone: r.phone || '',
          email: r.email || '',
          date: r.date || '',
          time: r.time || '',
          guests: Number(r.guests || 0),
          // keep tableNumber for compatibility (first table) and map tableNumbers fully
          tableNumbers: Array.isArray(r.tableNumbers) ? r.tableNumbers.map((n: any) => Number(n)) : (r.tableNumber ? [Number(r.tableNumber)] : []),
          tableNumber: Array.isArray(r.tableNumbers) && r.tableNumbers.length ? Number(r.tableNumbers[0]) : (r.tableNumber ? Number(r.tableNumber) : undefined),
          status: r.status || 'pending',
          specialRequests: r.specialRequests || undefined,
          occasion: r.occasion || undefined,
          createdAt,
          notes: r.notes || undefined,
        }
      })
      setReservations(mapped)
    } catch (err: any) {
      console.error('Failed to load reservations', err)
      setLoadError(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReservations() }, [])

  const openDetails = async (publicId: string) => {
    setDialogOpen(true)
    setSelectedReservationDetail(null)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const res = await fetch(`${API_BASE}/api/reservation/${publicId}`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      setSelectedReservationDetail(data)
    } catch (err: any) {
      console.error('Failed to load reservation detail', err)
      setDetailError(err?.message || 'Failed to load')
    } finally {
      setDetailLoading(false)
    }
  }

  const formatCurrency = (n: number | undefined | null) => {
    if (n === null || typeof n === 'undefined') return '-';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
    } catch (e) {
      return String(n);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "seated":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // compute date range based on dateFilter
  const toDateString = (d: Date) => d.toISOString().substring(0, 10)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday start
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  const matchesDateFilter = (resDateStr: string) => {
    if (!resDateStr) return false

    // Handle different date formats from backend
    let resDate: Date
    if (resDateStr.includes('T')) {
      // ISO format: 2024-01-15T00:00:00.000Z
      resDate = new Date(resDateStr)
    } else if (resDateStr.includes('-')) {
      // Date only format: 2024-01-15
      resDate = new Date(resDateStr + 'T00:00:00')
    } else {
      // Try parsing as-is
      resDate = new Date(resDateStr)
    }

    // If date is invalid, return false
    if (isNaN(resDate.getTime())) return false

    const resDateOnly = toDateString(resDate)
    const todayOnly = toDateString(today)
    const tomorrowOnly = toDateString(tomorrow)

    switch (dateFilter) {
      case 'today':
        return resDateOnly === todayOnly
      case 'tomorrow':
        return resDateOnly === tomorrowOnly
      case 'week':
        return resDate >= startOfWeek && resDate <= endOfWeek
      case 'month':
        return resDate >= startOfMonth && resDate <= endOfMonth
      default:
        return true
    }
  }

  // Get unique table numbers for filter options
  const allTableNumbers = Array.from(
    new Set(
      reservations.flatMap(r =>
        r.tableNumbers && r.tableNumbers.length > 0
          ? r.tableNumbers
          : r.tableNumber
            ? [r.tableNumber]
            : []
      )
    )
  ).sort((a, b) => a - b)

  const filteredReservations = reservations
    .filter((reservation) => {
      const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
      const matchesDate = matchesDateFilter(reservation.date)

      // Table filter logic
      const matchesTable = tableFilter === "all" ||
        (reservation.tableNumbers && reservation.tableNumbers.includes(parseInt(tableFilter))) ||
        (reservation.tableNumber && reservation.tableNumber === parseInt(tableFilter))

      return matchesStatus && matchesDate && matchesTable
    })
    .sort((a, b) => {
      // Sort by creation time (newest first)
      const dateA = new Date(a.createdAt || a.id || 0)
      const dateB = new Date(b.createdAt || b.id || 0)
      return dateB.getTime() - dateA.getTime()
    })

  const reservationsByStatus = {
    pending: filteredReservations.filter((r) => r.status === "pending").length,
    confirmed: filteredReservations.filter((r) => r.status === "confirmed").length,
    seated: filteredReservations.filter((r) => r.status === "seated").length,
    completed: filteredReservations.filter((r) => r.status === "completed").length,
    cancelled: filteredReservations.filter((r) => r.status === "cancelled").length,
  }

  // today's reservations should reflect the selected date filter when it's 'today' or 'tomorrow'
  const todayReservations = reservations.filter((r) => toDateString(new Date(r.date + 'T00:00:00')) === toDateString(today))
  const totalGuests = todayReservations.reduce((sum, r) => sum + r.guests, 0)
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Today's Reservations</p>
                <p className="text-3xl font-bold">{todayReservations.length}</p>
                <p className="text-xs text-muted-foreground">Bookings today</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold">{reservationsByStatus.pending}</p>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
                <p className="text-3xl font-bold">{reservationsByStatus.confirmed}</p>
                <p className="text-xs text-muted-foreground">Ready to serve</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Currently Seated</p>
                <p className="text-3xl font-bold">{reservationsByStatus.seated}</p>
                <p className="text-xs text-muted-foreground">Dining now</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Total Guests</p>
                <p className="text-3xl font-bold">{totalGuests}</p>
                <p className="text-xs text-muted-foreground">Expected today</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-20">
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {allTableNumbers.map((tableNum) => (
                  <SelectItem key={tableNum} value={tableNum.toString()}>
                    Table {tableNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reservations</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="seated">Seated</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            {/* <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" onClick={() => fetchReservations()} />
            </Button> */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="h-12 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all">
                  <Plus className="w-5 h-5 mr-2" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center">🍽️ New Reservation</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Step 1: Date & Time */}
                  <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-orange-600" />
                        Step 1: Select Date & Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="add-reservation-date" className="font-semibold">Date *</Label>
                          <input
                            id="add-reservation-date"
                            type="date"
                            className="w-full border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none"
                            value={newDate}
                            min={tomorrow.toISOString().substring(0, 10)}
                            onChange={(e: any) => { setNewDate(e.target.value); setSelectedTables([]); setAvailableTables([]); }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">Time *</Label>
                          <Select value={newTime} onValueChange={(v) => { setNewTime(v); setSelectedTables([]); setAvailableTables([]); }}>
                            <SelectTrigger className="border-2 border-orange-300 h-12">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateTimeSlots().map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 2: Table Selection */}
                  <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Step 2: Check Availability & Select Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button
                          variant="outline"
                          className="w-full h-12 border-2 border-blue-300 hover:bg-blue-100"
                          onClick={async () => {
                            if (!newDate || !newTime) {
                              warning('Please select date and time first', 'Missing Information')
                              return
                            }
                            try {
                              const qs = `?date=${encodeURIComponent(newDate)}&time=${encodeURIComponent(newTime)}&duration=60`
                              const res = await fetch(`${API_BASE}/api/tables/available${qs}`)
                              if (!res.ok) throw new Error(`Status ${res.status}`)
                              const data = await res.json()
                              const normalized = Array.isArray(data) ? data.map((t: any) => (typeof t === 'number' ? { tableNumber: t } : t)) : []
                              setAvailableTables(normalized)
                            } catch (err: any) {
                              console.error('Failed to fetch available tables', err)
                              setAvailableTables([])
                            }
                          }}
                          disabled={!newDate || !newTime}
                        >
                          🔍 Check Table Availability
                        </Button>

                        {availableTables.length === 0 && newDate && newTime && (
                          <p className="text-center text-muted-foreground py-4">Click "Check Availability" to see available tables</p>
                        )}

                        {availableTables.length > 0 && (
                          <div className="space-y-3">
                            <Label className="font-semibold">Available Tables (Select one or more)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {availableTables.map((t: any) => {
                                const tn = Number(t.tableNumber ?? t.number ?? t.table)
                                const cap = Number(t.capacity ?? t.seats ?? t.maxGuests ?? 0)
                                const isSelected = selectedTables.includes(tn)
                                return (
                                  <Button
                                    key={tn}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`h-16 flex flex-col ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'border-2 border-blue-300 hover:bg-blue-100'}`}
                                    onClick={() => {
                                      setSelectedTables((prev) =>
                                        prev.includes(tn) ? prev.filter((x) => x !== tn) : [...prev, tn]
                                      )
                                    }}
                                  >
                                    <span className="font-bold">Table {tn}</span>
                                    <span className="text-xs">{cap} seats</span>
                                  </Button>
                                )
                              })}
                            </div>
                            {selectedTables.length > 0 && (
                              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                                <p className="text-green-800 font-semibold">
                                  Selected: Table {selectedTables.join(', ')} • Total Capacity: {selectedTables.reduce((acc, tn) => {
                                    const tableObj = availableTables.find((x: any) => Number(x.tableNumber ?? x.number ?? x.table) === tn)
                                    return acc + (Number(tableObj?.capacity ?? tableObj?.seats ?? tableObj?.maxGuests ?? 0) || 0)
                                  }, 0)} seats
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 3: Customer Details */}
                  <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="w-5 h-5 text-green-600" />
                        Step 3: Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold">Customer Name *</Label>
                          <Input
                            placeholder="Enter customer name"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            className="border-2 border-green-300 h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">Phone Number *</Label>
                          <Input
                            placeholder="Enter phone number"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="border-2 border-green-300 h-12"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-semibold">Email (Optional)</Label>
                          <Input
                            placeholder="Enter email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="border-2 border-green-300 h-12"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-semibold">Special Requests (Optional)</Label>
                          <Textarea
                            placeholder="Any special requests, dietary restrictions, or celebration notes..."
                            value={newSpecialRequests}
                            onChange={(e) => setNewSpecialRequests(e.target.value)}
                            className="border-2 border-green-300 min-h-[80px]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Error Display */}
                {createError && (
                  <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-900/20">
                    <CardContent className="p-4">
                      <p className="text-red-800 dark:text-red-200 font-medium">❌ {createError}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      // Reset form
                      setNewDate('')
                      setNewTime('')
                      setSelectedTables([])
                      setAvailableTables([])
                      setNewCustomerName('')
                      setNewPhone('')
                      setNewEmail('')
                      setNewSpecialRequests('')
                      setCreateError(null)
                    }}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-8"
                    disabled={creating || !newDate || !newTime || selectedTables.length === 0 || !newCustomerName || !newPhone}
                    onClick={async () => {
                      setCreateError(null)
                      if (!newDate || !newTime || selectedTables.length === 0) {
                        setCreateError('Please select date, time and at least one table')
                        return
                      }
                      setCreating(true)
                      try {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
                        const payload: any = {
                          date: newDate,
                          time: newTime,
                          tableNumbers: selectedTables,
                          customerName: newCustomerName,
                          phone: newPhone,
                          email: newEmail,
                          specialRequests: newSpecialRequests,
                          guests: selectedTables.reduce((acc, tn) => {
                            const tableObj = availableTables.find((x: any) => Number(x.tableNumber ?? x.number ?? x.table) === tn)
                            return acc + (Number(tableObj?.capacity ?? tableObj?.seats ?? tableObj?.maxGuests ?? 0) || 0)
                          }, 0)
                        }
                        const res = await fetch(`${API_BASE}/api/reservation`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify(payload),
                        })
                        if (!res.ok) {
                          const txt = await res.text()
                          throw new Error(`Status ${res.status} ${txt}`)
                        }
                        // success - refresh
                        await fetchReservations()
                        setShowAddDialog(false)
                        // reset form
                        setNewDate('')
                        setNewTime('')
                        setAvailableTables([])
                        setSelectedTables([])
                        setNewCustomerName('')
                        setNewPhone('')
                        setNewEmail('')
                        setNewSpecialRequests('')
                      } catch (err: any) {
                        console.error('Failed to create reservation', err)
                        setCreateError(err?.message || 'Failed to create')
                      } finally {
                        setCreating(false)
                      }
                    }}>
                    {creating ? 'Creating...' : 'Create Reservation'}
                  </Button>
                </div>
                {createError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{createError}</p>}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Loading reservations...</span>
            </div>
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-500 mb-4">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Failed to load reservations</h3>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button onClick={fetchReservations} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reservations found</h3>
            <p className="text-muted-foreground">
              {statusFilter !== "all" || dateFilter !== "all" || tableFilter !== "all"
                ? "Try adjusting your filters"
                : "No reservations for the selected period"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    #{reservation.id}
                  </CardTitle>
                  <Badge className={`${getStatusColor(reservation.status)} shadow-sm font-semibold`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{reservation.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{reservation.time}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{reservation.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{reservation.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{reservation.guests} guests</span>
                    {reservation.tableNumbers && reservation.tableNumbers.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 max-w-full ml-2">
                        {reservation.tableNumbers.map((tn) => (
                          <Badge key={tn} variant="outline" className="whitespace-nowrap">Table {tn}</Badge>
                        ))}
                      </div>
                    ) : reservation.tableNumber ? (
                      <Badge variant="outline" className="ml-2">Table {reservation.tableNumber}</Badge>
                    ) : null}
                  </div>
                </div>

                {reservation.occasion && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{reservation.occasion}</p>
                  </div>
                )}

                {reservation.specialRequests && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      {reservation.specialRequests.length > 50
                        ? `${reservation.specialRequests.substring(0, 50)}...`
                        : reservation.specialRequests}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-colors"
                    onClick={() => openDetails(reservation.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 transition-colors"
                    onClick={() => {
                      setSelectedReservation(reservation)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Centralized Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reservation Details {selectedReservationDetail ? `- #${selectedReservationDetail.id || selectedReservationDetail._id}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {detailLoading && <p>Loading...</p>}
            {detailError && <p className="text-red-600 dark:text-red-400">{detailError}</p>}
            {!detailLoading && selectedReservationDetail && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Customer</Label>
                    <p className="font-medium">{selectedReservationDetail.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedReservationDetail.phone} · {selectedReservationDetail.email}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Booking</Label>
                    <div className="mt-1 text-sm">
                      <p>Date: <span className="font-medium">{selectedReservationDetail.date}</span></p>
                      <p>Time: <span className="font-medium">{selectedReservationDetail.time}</span></p>
                      <p>Guests: <span className="font-medium">{selectedReservationDetail.guests}</span></p>
                      {selectedReservationDetail.tableNumbers && selectedReservationDetail.tableNumbers.length ? (
                        <p>Tables: <span className="font-medium">{selectedReservationDetail.tableNumbers.join(', ')}</span></p>
                      ) : selectedReservationDetail.tableNumber ? (
                        <p>Table: <span className="font-medium">{selectedReservationDetail.tableNumber}</span></p>
                      ) : null}
                      <div className="mt-2">
                        <Badge className={getStatusColor(selectedReservationDetail.status)}>{(selectedReservationDetail.status || '').toString().charAt(0).toUpperCase() + (selectedReservationDetail.status || '').toString().slice(1)}</Badge>
                      </div>
                    </div>
                  </div>

                  {selectedReservationDetail.specialRequests && (
                    <div>
                      <Label className="text-sm font-medium">Special Requests</Label>
                      <p className="mt-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400 text-sm text-yellow-800 dark:text-yellow-200">{selectedReservationDetail.specialRequests}</p>
                    </div>
                  )}

                  {selectedReservationDetail.notes && (
                    <div>
                      <Label className="text-sm font-medium">Internal Notes</Label>
                      <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-gray-400 text-sm">{selectedReservationDetail.notes}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1 p-4 bg-gray-50 dark:bg-gray-800 rounded border">
                  <Label className="text-sm font-medium">Payment Summary</Label>
                  <div className="mt-3 text-sm">
                    {!selectedReservationDetail.payment ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <p className="font-medium">No payment information</p>
                        <p className="text-xs mt-1">Payment details will appear here after the reservation is billed.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">{formatCurrency(selectedReservationDetail.payment.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span className="font-medium">{formatCurrency(selectedReservationDetail.payment.tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium">{formatCurrency(selectedReservationDetail.payment.discount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Extra Charge</span>
                          <span className="font-medium">{formatCurrency(selectedReservationDetail.payment.extraCharge)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>{formatCurrency(selectedReservationDetail.payment.total)} {selectedReservationDetail.payment.currency ?? ''}</span>
                        </div>
                        <div className="mt-3">
                          <Label className="text-sm">Status</Label>
                          <p className="font-medium">{selectedReservationDetail.payment.paymentStatus}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button className="bg-green-600 text-white">Mark as Paid</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Reservation #{selectedReservation?.id}</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={selectedReservation.customerName}
                    onChange={(e) => setSelectedReservation({ ...selectedReservation, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={selectedReservation.phone}
                    onChange={(e) => setSelectedReservation({ ...selectedReservation, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={selectedReservation.email}
                    onChange={(e) => setSelectedReservation({ ...selectedReservation, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guests</Label>
                  <Input
                    type="number"
                    value={selectedReservation.guests}
                    onChange={(e) => setSelectedReservation({ ...selectedReservation, guests: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedReservation.date}
                    onChange={(e) => setSelectedReservation({ ...selectedReservation, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={selectedReservation.time}
                    onValueChange={(value) => setSelectedReservation({ ...selectedReservation, time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedReservation.status}
                    onValueChange={(value) => setSelectedReservation({ ...selectedReservation, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="seated">Seated</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Special Requests</Label>
                  <Textarea
                    value={selectedReservation.specialRequests || ''}
                    onChange={(e) => setSelectedReservation({ ...selectedReservation, specialRequests: e.target.value })}
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/reservation/${selectedReservation.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customerName: selectedReservation.customerName,
                          phone: selectedReservation.phone,
                          email: selectedReservation.email,
                          date: selectedReservation.date,
                          time: selectedReservation.time,
                          guests: selectedReservation.guests,
                          status: selectedReservation.status,
                          specialRequests: selectedReservation.specialRequests
                        })
                      })

                      if (!res.ok) throw new Error(`Failed to update: ${res.status}`)

                      // Refresh reservations and close dialog
                      await fetchReservations()
                      setShowEditDialog(false)
                      setSelectedReservation(null)
                    } catch (err: any) {
                      console.error('Failed to update reservation:', err)
                      error('Failed to update reservation: ' + (err.message || 'Unknown error'), 'Update Failed')
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
