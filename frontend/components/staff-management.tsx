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
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
      case "break":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
      case "offline":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
    }
  }

  const getAlertColor = (severity: StaffAlert["severity"]) => {
    switch (severity) {
      case "high":
        return "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
      case "medium":
        return "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
      case "low":
        return "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
      default:
        return "border-l-4 border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/20"
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
        <Card className="shadow-sm">
          <CardContent className="p-2">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-full min-w-max bg-transparent gap-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  Performance
                </TabsTrigger>
                <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="shifts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  Shifts
                </TabsTrigger>
                <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  Manage
                </TabsTrigger>
              </TabsList>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="overview" className="space-y-6">
          {/* Staff Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Active Staff</p>
                    <p className="text-3xl font-bold">{activeStaff}</p>
                    <p className="text-xs text-muted-foreground">Currently working</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">On Break</p>
                    <p className="text-3xl font-bold">{onBreakStaff}</p>
                    <p className="text-xs text-muted-foreground">Taking rest</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Coffee className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Orders Handled</p>
                    <p className="text-3xl font-bold">{totalOrdersHandled}</p>
                    <p className="text-xs text-muted-foreground">Today's total</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Avg Rating</p>
                    <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Performance score</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {staff.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-all duration-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-lg">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{member.role}</p>
                      </div>
                    </div>
                    <Badge 
                      className={`${getStatusColor(member.status)} font-semibold`} 
                      variant="secondary"
                    >
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
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Calendar className="w-3 h-3 mr-1" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg Efficiency</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">{avgEfficiency.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Team performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-500">{totalHoursWorked.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Worked today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Customer Rating</p>
                    <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Average score</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
                    <p className="text-3xl font-bold">{staff.length}</p>
                    <p className="text-xs text-muted-foreground">Team members</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                Today's Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <Card key={performer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg"
                                : index === 1
                                  ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md"
                                  : "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                              {performer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-base">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl text-primary">{performer.efficiency}%</p>
                          <p className="text-xs text-muted-foreground">Efficiency</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(departmentStats).map(([dept, stats]) => (
                  <Card key={dept} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base">{dept}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline" className="font-medium">
                              {stats.active}/{stats.total} active
                            </Badge>
                            <span className="font-bold text-primary">{stats.efficiency.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full transition-all duration-300 bg-gradient-to-r from-primary to-primary/70"
                            style={{ width: `${stats.efficiency}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-500">
                      {alerts.filter(a => a.severity === "high").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Urgent attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                      {alerts.filter(a => a.severity === "medium").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Needs review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Low Priority</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                      {alerts.filter(a => a.severity === "low").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Informational</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Total Alerts</p>
                    <p className="text-3xl font-bold">{alerts.length}</p>
                    <p className="text-xs text-muted-foreground">All notifications</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const staffMember = staff.find((s) => s.id === alert.staffId)
                  return (
                    <Card key={alert.id} className={`${getAlertColor(alert.severity)} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-0.5 flex-shrink-0">
                              {alert.severity === "high" && <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />}
                              {alert.severity === "medium" && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />}
                              {alert.severity === "low" && <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {staffMember?.name} • {alert.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={alert.severity === "high" ? "destructive" : "secondary"}
                            className="flex-shrink-0"
                          >
                            {alert.type}
                          </Badge>
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
          {/* Shift Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Morning Shift</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                      {staff.filter((s) => s.shift.includes("Morning")).length}
                    </p>
                    <p className="text-xs text-muted-foreground">9 AM - 5 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Evening Shift</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-500">
                      {staff.filter((s) => s.shift.includes("Evening")).length}
                    </p>
                    <p className="text-xs text-muted-foreground">5 PM - 1 AM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Full Day</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">
                      {staff.filter((s) => s.shift.includes("Full Day")).length}
                    </p>
                    <p className="text-xs text-muted-foreground">9 AM - 9 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="px-15 py-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-full">
                    <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">On Break</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                      {staff.filter((s) => s.status === "break").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Currently resting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shift Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  Morning Shift
                </CardTitle>
                <p className="text-sm text-muted-foreground">9 AM - 5 PM</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staff
                    .filter((s) => s.shift.includes("Morning"))
                    .map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                        <Badge className={getStatusColor(member.status)} variant="secondary">
                          {member.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                  Evening Shift
                </CardTitle>
                <p className="text-sm text-muted-foreground">5 PM - 1 AM</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staff
                    .filter((s) => s.shift.includes("Evening"))
                    .map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                        <Badge className={getStatusColor(member.status)} variant="secondary">
                          {member.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                  Full Day
                </CardTitle>
                <p className="text-sm text-muted-foreground">9 AM - 9 PM</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staff
                    .filter((s) => s.shift.includes("Full Day"))
                    .map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                Break Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff
                  .filter((s) => s.status === "break" || s.breakTime > 0)
                  .map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border-2 border-primary/20">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                                {member.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{member.breakTime} mins</p>
                            <Badge className={getStatusColor(member.status)} variant="secondary">
                              {member.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Staff Management</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add new staff and manage team operations</p>
                </div>
                <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
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
        </CardContent>
      </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">Mark Attendance</h4>
                    <p className="text-sm text-muted-foreground">Track staff check-in and check-out times</p>
                  </div>
                </div>
                <Button size="sm" className="w-full">
                  Manage Attendance
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">Shift Planning</h4>
                    <p className="text-sm text-muted-foreground">Plan and schedule upcoming shifts</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Plan Shifts
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">Performance Review</h4>
                    <p className="text-sm text-muted-foreground">Review and evaluate staff performance</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
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
