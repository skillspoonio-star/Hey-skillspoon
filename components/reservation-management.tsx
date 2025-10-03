"use client"

import { useState } from "react"
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
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show"
  specialRequests?: string
  occasion?: string
  createdAt: string
  notes?: string
}

export function ReservationManagement() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Mock reservations data
  const [reservations] = useState<Reservation[]>([
    {
      id: "RES001",
      customerName: "Arjun Mehta",
      phone: "+91 98765 43210",
      email: "arjun@email.com",
      date: "2024-01-15",
      time: "7:30 PM",
      guests: 4,
      tableNumber: 12,
      status: "confirmed",
      specialRequests: "Window seat preferred, celebrating anniversary",
      occasion: "Anniversary",
      createdAt: "2024-01-10 10:30 AM",
      notes: "VIP customer, regular visitor",
    },
    {
      id: "RES002",
      customerName: "Sneha Patel",
      phone: "+91 87654 32109",
      email: "sneha@email.com",
      date: "2024-01-15",
      time: "8:00 PM",
      guests: 2,
      status: "pending",
      specialRequests: "Vegetarian menu only",
      createdAt: "2024-01-14 2:15 PM",
    },
    {
      id: "RES003",
      customerName: "Vikram Singh",
      phone: "+91 76543 21098",
      email: "vikram@email.com",
      date: "2024-01-15",
      time: "6:45 PM",
      guests: 6,
      tableNumber: 8,
      status: "seated",
      occasion: "Business Meeting",
      createdAt: "2024-01-12 4:45 PM",
      notes: "Corporate client, needs quiet area",
    },
    {
      id: "RES004",
      customerName: "Kavya Sharma",
      phone: "+91 65432 10987",
      email: "kavya@email.com",
      date: "2024-01-16",
      time: "7:00 PM",
      guests: 8,
      status: "confirmed",
      specialRequests: "Birthday celebration, need cake arrangement",
      occasion: "Birthday",
      createdAt: "2024-01-13 11:20 AM",
    },
  ])

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

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const reservationsByStatus = {
    pending: filteredReservations.filter((r) => r.status === "pending").length,
    confirmed: filteredReservations.filter((r) => r.status === "confirmed").length,
    seated: filteredReservations.filter((r) => r.status === "seated").length,
    completed: filteredReservations.filter((r) => r.status === "completed").length,
    cancelled: filteredReservations.filter((r) => r.status === "cancelled").length,
  }

  const todayReservations = reservations.filter((r) => r.date === "2024-01-15")
  const totalGuests = todayReservations.reduce((sum, r) => sum + r.guests, 0)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Reservations</p>
                <p className="text-2xl font-bold text-blue-600">{todayReservations.length}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{reservationsByStatus.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{reservationsByStatus.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Seated</p>
                <p className="text-2xl font-bold text-orange-600">{reservationsByStatus.seated}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guests Today</p>
                <p className="text-2xl font-bold text-purple-600">{totalGuests}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
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
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Reservation</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input placeholder="Enter customer name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="Enter phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Guests</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guests" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Guest{num > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6:00">6:00 PM</SelectItem>
                        <SelectItem value="6:30">6:30 PM</SelectItem>
                        <SelectItem value="7:00">7:00 PM</SelectItem>
                        <SelectItem value="7:30">7:30 PM</SelectItem>
                        <SelectItem value="8:00">8:00 PM</SelectItem>
                        <SelectItem value="8:30">8:30 PM</SelectItem>
                        <SelectItem value="9:00">9:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Special Requests</Label>
                    <Textarea placeholder="Any special requests or notes..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600">Create Reservation</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredReservations.map((reservation) => (
          <Card key={reservation.id} className="hover:shadow-md transition-shadow">
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
                  {reservation.tableNumber && <Badge variant="outline">Table {reservation.tableNumber}</Badge>}
                </div>
              </div>

              {reservation.occasion && (
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-800">{reservation.occasion}</p>
                </div>
              )}

              {reservation.specialRequests && (
                <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-xs text-yellow-800">
                    {reservation.specialRequests.length > 50
                      ? `${reservation.specialRequests.substring(0, 50)}...`
                      : reservation.specialRequests}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Reservation Details - #{reservation.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Customer Information</Label>
                          <p className="text-sm mt-1">{reservation.customerName}</p>
                          <p className="text-sm text-muted-foreground">{reservation.phone}</p>
                          <p className="text-sm text-muted-foreground">{reservation.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Reservation Details</Label>
                          <p className="text-sm mt-1">Date: {reservation.date}</p>
                          <p className="text-sm">Time: {reservation.time}</p>
                          <p className="text-sm">Guests: {reservation.guests}</p>
                          {reservation.tableNumber && <p className="text-sm">Table: {reservation.tableNumber}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(reservation.status)}>
                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Occasion */}
                      {reservation.occasion && (
                        <div>
                          <Label className="text-sm font-medium">Occasion</Label>
                          <p className="text-sm mt-1 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                            {reservation.occasion}
                          </p>
                        </div>
                      )}

                      {/* Special Requests */}
                      {reservation.specialRequests && (
                        <div>
                          <Label className="text-sm font-medium">Special Requests</Label>
                          <p className="text-sm mt-1 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            {reservation.specialRequests}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {reservation.notes && (
                        <div>
                          <Label className="text-sm font-medium">Internal Notes</Label>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded border-l-4 border-gray-400">
                            {reservation.notes}
                          </p>
                        </div>
                      )}

                      {/* Booking Info */}
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium">Booking Information</Label>
                        <p className="text-sm mt-1 text-muted-foreground">Created: {reservation.createdAt}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" className="flex-1 bg-transparent">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Reservation
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent">
                          Confirm
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
    </div>
  )
}
