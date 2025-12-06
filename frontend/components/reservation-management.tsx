"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Clock, Phone, Users, CheckCircle, Search, Eye, Edit, Plus, RefreshCw } from "lucide-react"

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
  const router = useRouter()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [showAddDialog, setShowAddDialog] = useState(false)

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
    const resDate = new Date(resDateStr + 'T00:00:00')
    switch (dateFilter) {
      case 'today':
        return toDateString(resDate) === toDateString(today)
      case 'tomorrow':
        return toDateString(resDate) === toDateString(tomorrow)
      case 'week':
        return resDate >= startOfWeek && resDate <= endOfWeek
      case 'month':
        return resDate >= startOfMonth && resDate <= endOfMonth
      default:
        return true
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesDate = matchesDateFilter(reservation.date)
    return matchesSearch && matchesStatus && matchesDate
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, phone, or reservation ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" onClick={() => fetchReservations()} />
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={()=>{
                  //push to the dashboard/new-reservation
                  router.push("/dashboard/new-reservation")
                }}
                
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Add New Reservation</DialogTitle>
                </DialogHeader>

                {/* Date & Time first */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-reservation-date">Date</Label>
                    <input
                      id="add-reservation-date"
                      type="date"
                      className="w-full border rounded-md px-3 py-2 mt-1 cursor-pointer"
                      value={newDate}
                      min={tomorrow.toISOString().substring(0, 10)}
                      onClick={() => {
                        const el = document.getElementById('add-reservation-date') as HTMLInputElement | null
                        if (el && typeof (el as any).showPicker === 'function') {
                          ;(el as any).showPicker()
                          return
                        }
                        el?.focus()
                      }}
                      onChange={(e: any) => { setNewDate(e.target.value); setSelectedTables([]); setAvailableTables([]); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select value={newTime} onValueChange={(v) => { setNewTime(v); setSelectedTables([]); setAvailableTables([]); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                        <SelectItem value="18:30">6:30 PM</SelectItem>
                        <SelectItem value="19:00">7:00 PM</SelectItem>
                        <SelectItem value="19:30">7:30 PM</SelectItem>
                        <SelectItem value="20:00">8:00 PM</SelectItem>
                        <SelectItem value="20:30">8:30 PM</SelectItem>
                        <SelectItem value="21:00">9:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability / Table selection */}
                  <div className="col-span-2">
                    <Label>Available Tables</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={async () => {
                        // fetch available tables for the selected date/time
                        if (!newDate || !newTime) return
                        try {
                          const qs = `?date=${encodeURIComponent(newDate)}&time=${encodeURIComponent(newTime)}&duration=60`
                          const res = await fetch(`${API_BASE}/api/tables/available${qs}`)
                          if (!res.ok) throw new Error(`Status ${res.status}`)
                          const data = await res.json()
                          // normalize: backend might return array of numbers or objects
                          const normalized = Array.isArray(data) ? data.map((t: any) => (typeof t === 'number' ? { tableNumber: t } : t)) : []
                          setAvailableTables(normalized)
                        } catch (err: any) {
                          console.error('Failed to fetch available tables', err)
                          setAvailableTables([])
                        }
                      }}>Check Availability</Button>
                      {availableTables.length === 0 && <span className="text-sm text-muted-foreground">No availability checked yet</span>}
                    </div>
                    {availableTables.length > 0 && (
                      <div className="mt-3">
                        <Label className="text-sm">Select Tables</Label>
                        <Select
                          value={selectedTables.map(String).join(',')}
                          onValueChange={(v) => {
                            // v will be the clicked item's value (string) — toggle it
                            const num = Number(v)
                            if (Number.isNaN(num)) return
                            setSelectedTables((prev) => (prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num]))
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={
                              selectedTables.length ? `Table ${selectedTables.join(',')}` : 'Select tables'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTables.map((t: any) => {
                              const tn = Number(t.tableNumber ?? t.number ?? t.table)
                              const cap = Number(t.capacity ?? t.seats ?? t.maxGuests ?? 0)
                              return (
                                <SelectItem key={tn} value={String(tn)}>
                                  {`Table ${tn} (${cap} seats)`}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Customer details after table selection */}
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input placeholder="Enter customer name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="Enter phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="Enter email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Special Requests</Label>
                    <Textarea placeholder="Any special requests or notes..." value={newSpecialRequests} onChange={(e) => setNewSpecialRequests(e.target.value)} />
                  </div>
                </div>

                  <div className="mt-3 text-sm text-muted-foreground">Selected capacity: {selectedTables.reduce((acc, tn) => {
                    const tableObj = availableTables.find((x: any) => Number(x.tableNumber ?? x.number ?? x.table) === tn)
                    return acc + (Number(tableObj?.capacity ?? tableObj?.seats ?? tableObj?.maxGuests ?? 0) || 0)
                  }, 0)} seats</div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => { setShowAddDialog(false); }}>
                    Cancel
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600" onClick={async () => {
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
                {createError && <p className="text-sm text-red-600 mt-2">{createError}</p>}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredReservations.map((reservation) => (
          <Card key={reservation.id} className="hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#{reservation.id}</CardTitle>
                <Badge className={getStatusColor(reservation.status)}>
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
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-800">{reservation.occasion}</p>
                </div>
              )}

              {reservation.specialRequests && (
                <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-xs text-black">
                    {reservation.specialRequests.length > 50
                      ? `${reservation.specialRequests.substring(0, 50)}...`
                      : reservation.specialRequests}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => openDetails(reservation.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReservations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reservations found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Reservations will appear here when customers book tables"}
            </p>
          </CardContent>
        </Card>
      )}
      {/* Centralized Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reservation Details {selectedReservationDetail ? `- #${selectedReservationDetail.id || selectedReservationDetail._id}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {detailLoading && <p>Loading...</p>}
            {detailError && <p className="text-red-600">{detailError}</p>}
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
                      <p className="mt-1 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400 text-sm text-black">{selectedReservationDetail.specialRequests}</p>
                    </div>
                  )}

                  {selectedReservationDetail.notes && (
                    <div>
                      <Label className="text-sm font-medium">Internal Notes</Label>
                      <p className="mt-1 p-2 bg-gray-50 rounded border-l-4 border-gray-400 text-sm">{selectedReservationDetail.notes}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1 p-4 bg-gray-50 rounded border text-black">
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
    </div>
  )
}
