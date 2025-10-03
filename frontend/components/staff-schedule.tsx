"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  CalendarIcon,
  Plus,
  Edit,
  Coffee,
  UserCheck,
  UserX,
  CheckCircle,
  Timer,
  Phone,
  Mail,
  Star,
} from "lucide-react"
import { format, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"

interface StaffMember {
  id: string
  name: string
  role: string
  phone: string
  email: string
  avatar?: string
  rating: number
  status: "active" | "break" | "offline" | "sick" | "vacation"
  currentShift?: Shift
}

interface Shift {
  id: string
  staffId: string
  date: Date
  startTime: string
  endTime: string
  type: "morning" | "afternoon" | "evening" | "night" | "split"
  status: "scheduled" | "active" | "completed" | "missed" | "break"
  breakStart?: Date
  breakEnd?: Date
  notes?: string
  hoursWorked?: number
  ordersHandled?: number
}

interface BreakRecord {
  id: string
  staffId: string
  startTime: Date
  endTime?: Date
  type: "lunch" | "coffee" | "personal" | "emergency"
  duration?: number // in minutes
}

export function StaffSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "staff">("daily")
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isBreakDialogOpen, setIsBreakDialogOpen] = useState(false)

  // Sample staff data
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      role: "Head Chef",
      phone: "+91 98765 43210",
      email: "rajesh@restaurant.com",
      rating: 4.8,
      status: "active",
    },
    {
      id: "2",
      name: "Priya Sharma",
      role: "Waiter",
      phone: "+91 98765 43211",
      email: "priya@restaurant.com",
      rating: 4.6,
      status: "break",
    },
    {
      id: "3",
      name: "Amit Singh",
      role: "Kitchen Assistant",
      phone: "+91 98765 43212",
      email: "amit@restaurant.com",
      rating: 4.4,
      status: "active",
    },
    {
      id: "4",
      name: "Sunita Devi",
      role: "Cashier",
      phone: "+91 98765 43213",
      email: "sunita@restaurant.com",
      rating: 4.7,
      status: "offline",
    },
    {
      id: "5",
      name: "Vikram Patel",
      role: "Manager",
      phone: "+91 98765 43214",
      email: "vikram@restaurant.com",
      rating: 4.9,
      status: "active",
    },
  ])

  // Sample shifts data
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: "s1",
      staffId: "1",
      date: new Date(),
      startTime: "09:00",
      endTime: "17:00",
      type: "morning",
      status: "active",
      hoursWorked: 6.5,
      ordersHandled: 45,
    },
    {
      id: "s2",
      staffId: "2",
      date: new Date(),
      startTime: "09:00",
      endTime: "17:00",
      type: "morning",
      status: "break",
      breakStart: new Date(Date.now() - 15 * 60 * 1000),
      hoursWorked: 4.2,
      ordersHandled: 32,
    },
    {
      id: "s3",
      staffId: "3",
      date: new Date(),
      startTime: "10:00",
      endTime: "18:00",
      type: "morning",
      status: "active",
      hoursWorked: 5.8,
      ordersHandled: 28,
    },
    {
      id: "s4",
      staffId: "4",
      date: new Date(),
      startTime: "17:00",
      endTime: "01:00",
      type: "evening",
      status: "scheduled",
      hoursWorked: 0,
      ordersHandled: 0,
    },
  ])

  const [breaks, setBreaks] = useState<BreakRecord[]>([
    {
      id: "b1",
      staffId: "2",
      startTime: new Date(Date.now() - 15 * 60 * 1000),
      type: "coffee",
    },
  ])

  // Update current time and staff status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
      updateStaffStatus()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const updateStaffStatus = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    setStaff((prevStaff) =>
      prevStaff.map((member) => {
        const currentShift = shifts.find((s) => s.staffId === member.id && isSameDay(s.date, now))

        if (!currentShift) {
          return { ...member, status: "offline" as const, currentShift: undefined }
        }

        const [startHour, startMin] = currentShift.startTime.split(":").map(Number)
        const [endHour, endMin] = currentShift.endTime.split(":").map(Number)
        const shiftStart = startHour * 60 + startMin
        const shiftEnd = endHour * 60 + endMin

        const activeBreak = breaks.find((b) => b.staffId === member.id && b.startTime <= now && !b.endTime)

        let status: StaffMember["status"] = "offline"
        if (currentTime >= shiftStart && currentTime <= shiftEnd) {
          status = activeBreak ? "break" : "active"
        }

        return { ...member, status, currentShift }
      }),
    )
  }

  const startBreak = (staffId: string, type: BreakRecord["type"]) => {
    const newBreak: BreakRecord = {
      id: `b${Date.now()}`,
      staffId,
      startTime: new Date(),
      type,
    }
    setBreaks((prev) => [...prev, newBreak])

    // Update shift status
    setShifts((prev) =>
      prev.map((shift) =>
        shift.staffId === staffId && isSameDay(shift.date, new Date())
          ? { ...shift, status: "break" as const, breakStart: new Date() }
          : shift,
      ),
    )
  }

  const endBreak = (staffId: string) => {
    const now = new Date()
    setBreaks((prev) =>
      prev.map((breakRecord) => {
        if (breakRecord.staffId === staffId && !breakRecord.endTime) {
          const duration = Math.round((now.getTime() - breakRecord.startTime.getTime()) / (1000 * 60))
          return { ...breakRecord, endTime: now, duration }
        }
        return breakRecord
      }),
    )

    // Update shift status
    setShifts((prev) =>
      prev.map((shift) =>
        shift.staffId === staffId && isSameDay(shift.date, new Date())
          ? { ...shift, status: "active" as const, breakEnd: now }
          : shift,
      ),
    )
  }

  const getStatusColor = (status: StaffMember["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "break":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "offline":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "sick":
        return "bg-red-100 text-red-800 border-red-200"
      case "vacation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getShiftTypeColor = (type: Shift["type"]) => {
    switch (type) {
      case "morning":
        return "bg-blue-50 border-blue-200 text-blue-800"
      case "afternoon":
        return "bg-orange-50 border-orange-200 text-orange-800"
      case "evening":
        return "bg-purple-50 border-purple-200 text-purple-800"
      case "night":
        return "bg-indigo-50 border-indigo-200 text-indigo-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  const getCurrentBreak = (staffId: string) => {
    return breaks.find((b) => b.staffId === staffId && !b.endTime)
  }

  const getTodayShift = (staffId: string) => {
    return shifts.find((s) => s.staffId === staffId && isSameDay(s.date, currentDate))
  }

  const activeStaff = staff.filter((s) => s.status === "active").length
  const onBreakStaff = staff.filter((s) => s.status === "break").length
  const offlineStaff = staff.filter((s) => s.status === "offline").length
  const totalHoursToday = shifts
    .filter((s) => isSameDay(s.date, currentDate))
    .reduce((sum, s) => sum + (s.hoursWorked || 0), 0)

  return (
    <div className="space-y-6">
      {/* Staff Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{activeStaff}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Break</p>
                <p className="text-2xl font-bold text-yellow-600">{onBreakStaff}</p>
              </div>
              <Coffee className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-gray-600">{offlineStaff}</p>
              </div>
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold text-primary">{staff.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Today</p>
                <p className="text-2xl font-bold text-blue-600">{totalHoursToday.toFixed(1)}</p>
              </div>
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-purple-600">
                  {shifts.filter((s) => s.status === "scheduled").length}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="daily">Today's Schedule</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
          <Button variant="outline" size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Daily Schedule View */}
      {viewMode === "daily" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Today's Schedule - {format(currentDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.map((member) => {
                  const todayShift = getTodayShift(member.id)
                  const currentBreak = getCurrentBreak(member.id)

                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.role}</div>
                        </div>

                        <Badge className={getStatusColor(member.status)} variant="outline">
                          {member.status}
                        </Badge>

                        {todayShift && (
                          <div
                            className={cn("px-3 py-1 rounded-full text-sm border", getShiftTypeColor(todayShift.type))}
                          >
                            {todayShift.startTime} - {todayShift.endTime}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {todayShift && (
                          <div className="text-right text-sm">
                            <div className="font-medium">{todayShift.hoursWorked || 0}h worked</div>
                            <div className="text-muted-foreground">{todayShift.ordersHandled || 0} orders</div>
                          </div>
                        )}

                        {currentBreak && (
                          <div className="text-sm text-yellow-600">
                            Break: {Math.round((Date.now() - currentBreak.startTime.getTime()) / (1000 * 60))}m
                          </div>
                        )}

                        <div className="flex gap-2">
                          {member.status === "active" && (
                            <Dialog open={isBreakDialogOpen} onOpenChange={setIsBreakDialogOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedStaff(member)}>
                                  <Coffee className="w-4 h-4 mr-2" />
                                  Break
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Start Break - {selectedStaff?.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Break Type</Label>
                                    <Select
                                      onValueChange={(value: BreakRecord["type"]) => {
                                        if (selectedStaff) {
                                          startBreak(selectedStaff.id, value)
                                          setIsBreakDialogOpen(false)
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select break type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="coffee">Coffee Break (15 min)</SelectItem>
                                        <SelectItem value="lunch">Lunch Break (30 min)</SelectItem>
                                        <SelectItem value="personal">Personal Break</SelectItem>
                                        <SelectItem value="emergency">Emergency Break</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          {member.status === "break" && (
                            <Button
                              size="sm"
                              onClick={() => endBreak(member.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              End Break
                            </Button>
                          )}

                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Management View */}
      {viewMode === "staff" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const todayShift = getTodayShift(member.id)
            const currentBreak = getCurrentBreak(member.id)

            return (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(member.status)} variant="outline">
                      {member.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {todayShift && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Today's Shift:</span>
                        <span className={cn("px-2 py-1 rounded text-xs", getShiftTypeColor(todayShift.type))}>
                          {todayShift.startTime} - {todayShift.endTime}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                        <span>{member.rating}</span>
                      </div>
                    </div>

                    {todayShift && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hours Today:</span>
                          <span>{todayShift.hoursWorked || 0}h</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Orders Handled:</span>
                          <span>{todayShift.ordersHandled || 0}</span>
                        </div>
                      </>
                    )}

                    {currentBreak && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Break Duration:</span>
                        <span className="text-yellow-600">
                          {Math.round((Date.now() - currentBreak.startTime.getTime()) / (1000 * 60))}m
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{member.email}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </div>

                    {member.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => {
                          setSelectedStaff(member)
                          setIsBreakDialogOpen(true)
                        }}
                      >
                        <Coffee className="w-4 h-4 mr-2" />
                        Start Break
                      </Button>
                    )}

                    {member.status === "break" && (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => endBreak(member.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        End Break
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Weekly View */}
      {viewMode === "weekly" && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">Weekly schedule view coming soon...</div>
          </CardContent>
        </Card>
      )}

      {/* Break Dialog */}
      <Dialog open={isBreakDialogOpen} onOpenChange={setIsBreakDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Break - {selectedStaff?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Break Type</Label>
              <Select
                onValueChange={(value: BreakRecord["type"]) => {
                  if (selectedStaff) {
                    startBreak(selectedStaff.id, value)
                    setIsBreakDialogOpen(false)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select break type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coffee">Coffee Break (15 min)</SelectItem>
                  <SelectItem value="lunch">Lunch Break (30 min)</SelectItem>
                  <SelectItem value="personal">Personal Break</SelectItem>
                  <SelectItem value="emergency">Emergency Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
