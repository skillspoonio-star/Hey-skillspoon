"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Users,
  Star,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3,
  Award,
  Target,
  Activity,
  Bell,
  UserPlus,
  Settings,
  CheckCircle,
  Coffee,
} from "lucide-react"

interface StaffMember {
  id: number
  name: string
  role: string
  status: "active" | "break" | "offline"
  shift: string
  rating: number
  phone: string
  email: string
  ordersHandled: number
  hoursWorked: number
  efficiency: number
  customerFeedback: number
  tasksCompleted: number
  totalTasks: number
  breakTime: number
  overtimeHours: number
  joinDate: string
  department: string
}

interface StaffAlert {
  id: number
  staffId: number
  type: "performance" | "attendance" | "break" | "overtime"
  message: string
  severity: "low" | "medium" | "high"
  timestamp: Date
}

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 1,
      name: "Rajesh Kumar",
      role: "Head Chef",
      status: "active",
      shift: "Morning (9 AM - 5 PM)",
      rating: 4.8,
      phone: "+91 98765 43210",
      email: "rajesh@restaurant.com",
      ordersHandled: 45,
      hoursWorked: 6.5,
      efficiency: 92,
      customerFeedback: 4.7,
      tasksCompleted: 18,
      totalTasks: 20,
      breakTime: 45,
      overtimeHours: 1.5,
      joinDate: "2022-03-15",
      department: "Kitchen",
    },
    {
      id: 2,
      name: "Priya Sharma",
      role: "Waiter",
      status: "active",
      shift: "Morning (9 AM - 5 PM)",
      rating: 4.6,
      phone: "+91 98765 43211",
      email: "priya@restaurant.com",
      ordersHandled: 32,
      hoursWorked: 6.5,
      efficiency: 88,
      customerFeedback: 4.5,
      tasksCompleted: 25,
      totalTasks: 28,
      breakTime: 30,
      overtimeHours: 0,
      joinDate: "2023-01-20",
      department: "Service",
    },
    {
      id: 3,
      name: "Amit Singh",
      role: "Kitchen Assistant",
      status: "break",
      shift: "Morning (9 AM - 5 PM)",
      rating: 4.4,
      phone: "+91 98765 43212",
      email: "amit@restaurant.com",
      ordersHandled: 28,
      hoursWorked: 4.2,
      efficiency: 75,
      customerFeedback: 4.2,
      tasksCompleted: 12,
      totalTasks: 16,
      breakTime: 60,
      overtimeHours: 0,
      joinDate: "2023-06-10",
      department: "Kitchen",
    },
    {
      id: 4,
      name: "Sunita Devi",
      role: "Cashier",
      status: "active",
      shift: "Evening (5 PM - 1 AM)",
      rating: 4.7,
      phone: "+91 98765 43213",
      email: "sunita@restaurant.com",
      ordersHandled: 38,
      hoursWorked: 2.5,
      efficiency: 95,
      customerFeedback: 4.8,
      tasksCompleted: 15,
      totalTasks: 15,
      breakTime: 15,
      overtimeHours: 0,
      joinDate: "2022-11-05",
      department: "Service",
    },
    {
      id: 5,
      name: "Vikram Patel",
      role: "Manager",
      status: "offline",
      shift: "Full Day (9 AM - 9 PM)",
      rating: 4.9,
      phone: "+91 98765 43214",
      email: "vikram@restaurant.com",
      ordersHandled: 0,
      hoursWorked: 0,
      efficiency: 0,
      customerFeedback: 4.9,
      tasksCompleted: 8,
      totalTasks: 10,
      breakTime: 0,
      overtimeHours: 0,
      joinDate: "2021-08-12",
      department: "Management",
    },
  ])

  const [alerts] = useState<StaffAlert[]>([
    {
      id: 1,
      staffId: 3,
      type: "break",
      message: "Amit Singh has been on break for over 45 minutes",
      severity: "medium",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: 2,
      staffId: 1,
      type: "overtime",
      message: "Rajesh Kumar is approaching overtime hours",
      severity: "low",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: 3,
      staffId: 2,
      type: "performance",
      message: "Priya Sharma received excellent customer feedback",
      severity: "low",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
    },
  ])

  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    shift: "",
    department: "",
  })

  const [isAddingStaff, setIsAddingStaff] = useState(false)

  const getStatusColor = (status: StaffMember["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "break":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAlertColor = (severity: StaffAlert["severity"]) => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50"
      case "medium":
        return "border-yellow-200 bg-yellow-50"
      case "low":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.role || !newStaff.phone || !newStaff.email) {
      alert("Please fill in all required fields")
      return
    }

    const newMember: StaffMember = {
      id: Math.max(...staff.map((s) => s.id)) + 1,
      name: newStaff.name,
      role: newStaff.role,
      phone: newStaff.phone,
      email: newStaff.email,
      shift: newStaff.shift,
      department: newStaff.department,
      status: "offline",
      rating: 0,
      ordersHandled: 0,
      hoursWorked: 0,
      efficiency: 0,
      customerFeedback: 0,
      tasksCompleted: 0,
      totalTasks: 0,
      breakTime: 0,
      overtimeHours: 0,
      joinDate: new Date().toISOString().split("T")[0],
    }

    setStaff([...staff, newMember])
    setNewStaff({ name: "", role: "", phone: "", email: "", shift: "", department: "" })
    setIsAddingStaff(false)
  }

  const activeStaff = staff.filter((s) => s.status === "active").length
  const onBreakStaff = staff.filter((s) => s.status === "break").length
  const totalOrdersHandled = staff.reduce((sum, s) => sum + s.ordersHandled, 0)
  const avgRating = staff.reduce((sum, s) => sum + s.rating, 0) / staff.length
  const avgEfficiency = staff.reduce((sum, s) => sum + s.efficiency, 0) / staff.length
  const totalHoursWorked = staff.reduce((sum, s) => sum + s.hoursWorked, 0)

  const topPerformers = [...staff]
    .filter((s) => s.efficiency > 0)
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 3)

  const departmentStats = staff.reduce(
    (acc, member) => {
      if (!acc[member.department]) {
        acc[member.department] = { total: 0, active: 0, efficiency: 0 }
      }
      acc[member.department].total++
      if (member.status === "active") acc[member.department].active++
      acc[member.department].efficiency += member.efficiency
      return acc
    },
    {} as Record<string, { total: number; active: number; efficiency: number }>,
  )

  Object.keys(departmentStats).forEach((dept) => {
    departmentStats[dept].efficiency = departmentStats[dept].efficiency / departmentStats[dept].total
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Staff Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Staff</p>
                    <p className="text-2xl font-bold text-green-600">{activeStaff}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
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
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Orders Handled</p>
                    <p className="text-2xl font-bold text-primary">{totalOrdersHandled}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold text-accent">{avgRating.toFixed(1)}</p>
                  </div>
                  <Star className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((member) => (
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
                    <Badge className={getStatusColor(member.status)} variant="secondary">
                      {member.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Shift:</span>
                      <span>{member.shift}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                        <span>{member.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Orders Today:</span>
                      <span>{member.ordersHandled}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Hours Worked:</span>
                      <span>{member.hoursWorked}h</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Efficiency:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={member.efficiency} className="w-16 h-2" />
                        <span>{member.efficiency}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasks:</span>
                      <span>
                        {member.tasksCompleted}/{member.totalTasks}
                      </span>
                    </div>

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
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                    <p className="text-2xl font-bold text-primary">{avgEfficiency.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold text-chart-2">{totalHoursWorked.toFixed(1)}h</p>
                  </div>
                  <Clock className="w-8 h-8 text-chart-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Rating</p>
                    <p className="text-2xl font-bold text-accent">{avgRating.toFixed(1)}</p>
                  </div>
                  <Star className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Today's Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {performer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">{performer.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{performer.efficiency}%</p>
                      <p className="text-sm text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(departmentStats).map(([dept, stats]) => (
                  <div key={dept} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{dept}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          {stats.active}/{stats.total} active
                        </span>
                        <span>{stats.efficiency.toFixed(1)}% efficiency</span>
                      </div>
                    </div>
                    <Progress value={stats.efficiency} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Staff Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const staffMember = staff.find((s) => s.id === alert.staffId)
                  return (
                    <Card key={alert.id} className={getAlertColor(alert.severity)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {alert.severity === "high" && <AlertTriangle className="w-5 h-5 text-red-600" />}
                              {alert.severity === "medium" && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                              {alert.severity === "low" && <Activity className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div>
                              <p className="font-medium">{alert.message}</p>
                              <p className="text-sm text-muted-foreground">
                                {staffMember?.name} • {alert.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>{alert.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Shift Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Shift Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Morning Shift (9 AM - 5 PM)</h4>
                      <div className="space-y-2">
                        {staff
                          .filter((s) => s.shift.includes("Morning"))
                          .map((member) => (
                            <div key={member.id} className="flex items-center justify-between text-sm">
                              <span>{member.name}</span>
                              <Badge className={getStatusColor(member.status)} variant="secondary">
                                {member.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Evening Shift (5 PM - 1 AM)</h4>
                      <div className="space-y-2">
                        {staff
                          .filter((s) => s.shift.includes("Evening"))
                          .map((member) => (
                            <div key={member.id} className="flex items-center justify-between text-sm">
                              <span>{member.name}</span>
                              <Badge className={getStatusColor(member.status)} variant="secondary">
                                {member.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Full Day (9 AM - 9 PM)</h4>
                      <div className="space-y-2">
                        {staff
                          .filter((s) => s.shift.includes("Full Day"))
                          .map((member) => (
                            <div key={member.id} className="flex items-center justify-between text-sm">
                              <span>{member.name}</span>
                              <Badge className={getStatusColor(member.status)} variant="secondary">
                                {member.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Break Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coffee className="w-5 h-5" />
                      Break Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {staff
                        .filter((s) => s.status === "break" || s.breakTime > 0)
                        .map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{member.breakTime} mins</p>
                              <Badge className={getStatusColor(member.status)} variant="secondary">
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staff Management</h3>
            <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={newStaff.role}
                      onValueChange={(value) => setNewStaff((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chef">Chef</SelectItem>
                        <SelectItem value="Waiter">Waiter</SelectItem>
                        <SelectItem value="Kitchen Assistant">Kitchen Assistant</SelectItem>
                        <SelectItem value="Cashier">Cashier</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Cleaner">Cleaner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={newStaff.department}
                      onValueChange={(value) => setNewStaff((prev) => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kitchen">Kitchen</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shift">Shift *</Label>
                    <Select
                      value={newStaff.shift}
                      onValueChange={(value) => setNewStaff((prev) => ({ ...prev, shift: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning (9 AM - 5 PM)">Morning (9 AM - 5 PM)</SelectItem>
                        <SelectItem value="Evening (5 PM - 1 AM)">Evening (5 PM - 1 AM)</SelectItem>
                        <SelectItem value="Full Day (9 AM - 9 PM)">Full Day (9 AM - 9 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddStaff} className="flex-1">
                      Add Staff Member
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingStaff(false)} className="flex-1 bg-transparent">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-medium">Mark Attendance</h4>
                    <p className="text-sm text-muted-foreground">Track staff check-in/out</p>
                  </div>
                </div>
                <Button size="sm" className="w-full">
                  Manage Attendance
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Shift Planning</h4>
                    <p className="text-sm text-muted-foreground">Plan upcoming shifts</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  Plan Shifts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-medium">Performance Review</h4>
                    <p className="text-sm text-muted-foreground">Review staff performance</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  Review Performance
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
