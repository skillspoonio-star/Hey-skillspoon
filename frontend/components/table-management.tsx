"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Clock,
  DollarSign,
  Utensils,
  QrCode,
  Plus,
  Edit,
  Phone,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Wrench,
  Sparkles,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Order } from "@/hooks/use-order-manager"

interface TableManagementProps {
  orders: Order[]
}

interface TableActivity {
  id: string
  type: "cleaning" | "maintenance" | "setup" | "inspection"
  status: "pending" | "in-progress" | "completed"
  assignedTo?: string
  startTime?: Date
  completedTime?: Date
  notes?: string
  estimatedDuration: number // in minutes
}

interface Table {
  number: number
  capacity: number
  status: "available" | "occupied" | "reserved" | "cleaning" | "maintenance" | "setup"
  currentOrder?: Order
  estimatedTime?: number
  reservationName?: string
  reservationPhone?: string
  reservationTime?: Date
  section?: "main" | "patio" | "private" | "bar"
  server?: string
  activities: TableActivity[]
  lastCleaned?: Date
  nextMaintenance?: Date
}

interface Reservation {
  id: string
  customerName: string
  tableNumber: number
  reservationTime: Date
  partySize: number
}

export function TableManagement({ orders }: TableManagementProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"floor" | "list" | "activities">("floor")
  const [activityFilter, setActivityFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all")
  const [reservations, setReservations] = useState<Reservation[]>([])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const [tables, setTables] = useState<Table[]>(() => {
    const tableData: Table[] = []
    const sections = ["main", "patio", "private", "bar"] as const
    const servers = ["Alice", "Bob", "Charlie", "Diana", "Eve"]
    const cleaningStaff = ["John", "Mary", "Sam", "Lisa"]

    for (let i = 1; i <= 24; i++) {
      const currentOrder = orders.find((order) => order.tableNumber === i && order.status !== "served")
      const section = sections[Math.floor((i - 1) / 6)]
      const isReserved = !currentOrder && Math.random() > 0.8
      const needsCleaning = Math.random() > 0.7
      const needsMaintenance = Math.random() > 0.9

      // Generate sample activities
      const activities: TableActivity[] = []
      if (needsCleaning) {
        activities.push({
          id: `clean-${i}-${Date.now()}`,
          type: "cleaning",
          status: Math.random() > 0.5 ? "pending" : "in-progress",
          assignedTo: cleaningStaff[Math.floor(Math.random() * cleaningStaff.length)],
          startTime: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 60 * 1000) : undefined,
          estimatedDuration: 15,
          notes: "Standard table cleaning after customer departure",
        })
      }

      if (needsMaintenance) {
        activities.push({
          id: `maint-${i}-${Date.now()}`,
          type: "maintenance",
          status: "pending",
          assignedTo: "Maintenance Team",
          estimatedDuration: 30,
          notes: "Weekly table and chair inspection",
        })
      }

      const tableStatus = currentOrder
        ? "occupied"
        : isReserved
          ? "reserved"
          : activities.some((a) => a.type === "cleaning" && a.status !== "completed")
            ? "cleaning"
            : activities.some((a) => a.type === "maintenance" && a.status !== "completed")
              ? "maintenance"
              : "available"

      tableData.push({
        number: i,
        capacity: i <= 8 ? 2 : i <= 16 ? 4 : i <= 20 ? 6 : 8,
        status: tableStatus as Table["status"],
        currentOrder,
        estimatedTime: currentOrder ? Math.floor(Math.random() * 45) + 15 : undefined,
        section,
        server: servers[Math.floor(Math.random() * servers.length)],
        reservationName: isReserved ? `Customer ${i}` : undefined,
        reservationPhone: isReserved ? `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}` : undefined,
        reservationTime: isReserved ? new Date(Date.now() + Math.random() * 3600000) : undefined,
        activities,
        lastCleaned: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000), // Random time in last 4 hours
        nextMaintenance: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in next 7 days
      })
    }
    return tableData
  })

  const updateTableStatus = (tableNumber: number, newStatus: Table["status"]) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.number === tableNumber) {
          const updatedTable = { ...table, status: newStatus }

          // Auto-create activities based on status change
          if (
            newStatus === "cleaning" &&
            !table.activities.some((a) => a.type === "cleaning" && a.status !== "completed")
          ) {
            updatedTable.activities.push({
              id: `clean-${tableNumber}-${Date.now()}`,
              type: "cleaning",
              status: "pending",
              estimatedDuration: 15,
              notes: "Table cleaning required",
            })
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const updateActivity = (tableNumber: number, activityId: string, updates: Partial<TableActivity>) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.number === tableNumber) {
          const updatedActivities = table.activities.map((activity) => {
            if (activity.id === activityId) {
              const updatedActivity = { ...activity, ...updates }

              // Auto-update timestamps
              if (updates.status === "in-progress" && !activity.startTime) {
                updatedActivity.startTime = new Date()
              }
              if (updates.status === "completed" && !activity.completedTime) {
                updatedActivity.completedTime = new Date()

                // Update table status if all activities are completed
                const allCompleted = table.activities.every((a) =>
                  a.id === activityId ? true : a.status === "completed",
                )
                if (allCompleted && table.status !== "occupied" && table.status !== "reserved") {
                  return {
                    ...table,
                    status: "available" as Table["status"],
                    activities: table.activities.map((a) => (a.id === activityId ? updatedActivity : a)),
                  }
                }
              }

              return updatedActivity
            }
            return activity
          })

          return { ...table, activities: updatedActivities }
        }
        return table
      }),
    )
  }

  const addActivity = (tableNumber: number, activity: Omit<TableActivity, "id">) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.number === tableNumber) {
          const newActivity: TableActivity = {
            ...activity,
            id: `${activity.type}-${tableNumber}-${Date.now()}`,
          }
          return {
            ...table,
            activities: [...table.activities, newActivity],
          }
        }
        return table
      }),
    )
  }

  const getTableStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-chart-2/20 border-chart-2 text-chart-2 dark:text-green-400 hover:bg-chart-2/30"
      case "occupied":
        return "bg-destructive/20 border-destructive text-destructive dark:text-red-400 hover:bg-destructive/30"
      case "reserved":
        return "bg-primary/20 border-primary text-primary dark:text-blue-400 hover:bg-primary/30"
      case "cleaning":
        return "bg-chart-4/20 border-chart-4 text-chart-4 dark:text-yellow-400 hover:bg-chart-4/30"
      case "maintenance":
        return "bg-orange-100 border-orange-400 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30"
      case "setup":
        return "bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30"
      default:
        return "bg-muted border-muted-foreground text-muted-foreground"
    }
  }

  const getStatusIcon = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return <Utensils className="w-4 h-4" />
      case "occupied":
        return <Users className="w-4 h-4" />
      case "reserved":
        return <Calendar className="w-4 h-4" />
      case "cleaning":
        return <Sparkles className="w-4 h-4" />
      case "maintenance":
        return <Wrench className="w-4 h-4" />
      case "setup":
        return <QrCode className="w-4 h-4" />
      default:
        return <Utensils className="w-4 h-4" />
    }
  }

  const getActivityIcon = (type: TableActivity["type"]) => {
    switch (type) {
      case "cleaning":
        return <Sparkles className="w-4 h-4" />
      case "maintenance":
        return <Wrench className="w-4 h-4" />
      case "setup":
        return <QrCode className="w-4 h-4" />
      case "inspection":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getActivityProgress = (activity: TableActivity) => {
    if (activity.status === "completed") return 100
    if (activity.status === "pending") return 0

    // Calculate progress based on time elapsed
    if (activity.startTime) {
      const elapsed = (Date.now() - activity.startTime.getTime()) / (1000 * 60) // minutes
      const progress = Math.min((elapsed / activity.estimatedDuration) * 100, 95)
      return Math.round(progress)
    }

    return 10 // Default for in-progress without start time
  }

  const availableTables = tables.filter((t) => t.status === "available").length
  const occupiedTables = tables.filter((t) => t.status === "occupied").length
  const reservedTables = tables.filter((t) => t.status === "reserved").length
  const cleaningTables = tables.filter((t) => t.status === "cleaning").length
  const setupTables = tables.filter((t) => t.status === "setup").length
  const allActivities = tables.flatMap((table) =>
    table.activities.map((activity) => ({ ...activity, tableNumber: table.number })),
  )
  const pendingActivities = allActivities.filter((a) => a.status === "pending").length
  const inProgressActivities = allActivities.filter((a) => a.status === "in-progress").length

  const totalRevenue = orders.filter((order) => order.status === "served").reduce((sum, order) => sum + order.total, 0)

  const averageTableTurnover = occupiedTables > 0 ? Math.round(totalRevenue / occupiedTables) : 0

  return (
    <div className="space-y-6">
      {/* Enhanced Table Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl md:text-xl font-bold text-chart-2">{availableTables}</p>
              </div>
              <Utensils className="w-6 h-6 md:w-8 md:h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Occupied</p>
                <p className="text-xl md:text-xl font-bold text-destructive">{occupiedTables}</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reserved</p>
                <p className="text-xl md:text-xl font-bold text-primary">{reservedTables}</p>
              </div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cleaning</p>
                <p className="text-xl md:text-xl font-bold text-chart-4">{cleaningTables}</p>
              </div>
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Tasks</p>
                <p className="text-xl md:text-xl font-bold text-orange-600">{pendingActivities}</p>
              </div>
              <Timer className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl md:text-xl font-bold text-blue-600">{inProgressActivities}</p>
              </div>
              <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Occupancy</p>
                <p className="text-xl md:text-xl font-bold text-primary">
                  {Math.round((occupiedTables / tables.length) * 100)}%
                </p>
              </div>
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Revenue</p>
                <p className="text-xl md:text-xl font-bold text-accent">₹{averageTableTurnover}</p>
              </div>
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="floor" className="flex-1 sm:flex-none">
              Floor Plan
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 sm:flex-none">
              List View
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex-1 sm:flex-none">
              Activities
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Reservation
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
            <Sparkles className="w-4 h-4 mr-2" />
            Schedule Cleaning
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
            <Edit className="w-4 h-4 mr-2" />
            Edit Layout
          </Button>
        </div>
      </div>

      {viewMode === "activities" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Label className="text-sm">Filter Activities:</Label>
            <Select value={activityFilter} onValueChange={(value: any) => setActivityFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {allActivities
              .filter((activity) => activityFilter === "all" || activity.status === activityFilter)
              .map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <div>
                            <div className="font-medium capitalize text-sm md:text-base">
                              {activity.type} - Table {activity.tableNumber}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              {activity.assignedTo && `Assigned to: ${activity.assignedTo}`}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            activity.status === "completed"
                              ? "default"
                              : activity.status === "in-progress"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        {activity.status === "in-progress" && (
                          <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <Progress value={getActivityProgress(activity)} className="w-full sm:w-24" />
                            <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                              {getActivityProgress(activity)}%
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {activity.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateActivity(activity.tableNumber, activity.id, { status: "in-progress" })
                              }
                            >
                              Start
                            </Button>
                          )}
                          {activity.status === "in-progress" && (
                            <Button
                              size="sm"
                              onClick={() => updateActivity(activity.tableNumber, activity.id, { status: "completed" })}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {activity.notes && (
                      <div className="mt-2 text-xs md:text-sm text-muted-foreground break-words">{activity.notes}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Floor Plan by Section */}
      {viewMode === "floor" && (
        <div className="space-y-6">
          {["main", "patio", "private", "bar"].map((section) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="capitalize text-base md:text-base">{section} Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                  {tables
                    .filter((table) => table.section === section)
                    .map((table) => (
                      <Dialog key={table.number} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <div
                            className={cn(
                              "relative p-3 md:p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer",
                              getTableStatusColor(table.status),
                            )}
                            onClick={() => setSelectedTable(table)}
                          >
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">{getStatusIcon(table.status)}</div>
                              <div className="font-bold text-sm md:text-base dark:text-white">T{table.number}</div>
                              <div className="text-xs opacity-75 dark:text-gray-200">{table.capacity} seats</div>

                              {table.activities.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex justify-center gap-1">
                                    {table.activities.slice(0, 3).map((activity) => (
                                      <div
                                        key={activity.id}
                                        className={cn(
                                          "w-2 h-2 rounded-full",
                                          activity.status === "completed"
                                            ? "bg-green-500"
                                            : activity.status === "in-progress"
                                              ? "bg-blue-500"
                                              : "bg-orange-500",
                                        )}
                                      />
                                    ))}
                                    {table.activities.length > 3 && (
                                      <span className="text-xs dark:text-gray-200">+{table.activities.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {table.currentOrder && (
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs font-medium dark:text-white">₹{table.currentOrder.total}</div>
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1 py-0 dark:text-white dark:border-gray-400"
                                  >
                                    {table.currentOrder.status}
                                  </Badge>
                                  {table.estimatedTime && (
                                    <div className="text-xs opacity-75 dark:text-gray-200">
                                      {table.estimatedTime}m left
                                    </div>
                                  )}
                                </div>
                              )}

                              {table.status === "reserved" && table.reservationTime && (
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs font-medium truncate dark:text-white">
                                    {table.reservationName}
                                  </div>
                                  <div className="text-xs opacity-75 dark:text-gray-200">
                                    {table.reservationTime.toLocaleTimeString()}
                                  </div>
                                </div>
                              )}

                              {table.server && (
                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                  {table.server.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogTrigger>

                        {selectedTable && (
                          <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-base md:text-base">
                                Table {selectedTable.number} Management
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm text-muted-foreground">Status</Label>
                                  <Badge variant="outline" className="mt-1">
                                    {selectedTable.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Capacity</Label>
                                  <p className="font-medium">{selectedTable.capacity} seats</p>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Section</Label>
                                  <p className="font-medium capitalize">{selectedTable.section}</p>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Server</Label>
                                  <p className="font-medium">{selectedTable.server}</p>
                                </div>
                              </div>

                              {selectedTable.currentOrder && (
                                <div className="border-t pt-4">
                                  <Label className="text-sm text-muted-foreground">Current Order</Label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between">
                                      <span>Order #{selectedTable.currentOrder.id}</span>
                                      <Badge>{selectedTable.currentOrder.status}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total</span>
                                      <span className="font-bold">₹{selectedTable.currentOrder.total}</span>
                                    </div>
                                    {selectedTable.estimatedTime && (
                                      <div className="flex justify-between">
                                        <span>Est. Time</span>
                                        <span>{selectedTable.estimatedTime} minutes</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {selectedTable.status === "reserved" && (
                                <div className="border-t pt-4">
                                  <Label className="text-sm text-muted-foreground">Reservation Details</Label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      <span>{selectedTable.reservationName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      <span>{selectedTable.reservationPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      <span>{selectedTable.reservationTime?.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Activities Section */}
                              <div className="border-t pt-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                                  <Label className="text-base md:text-lg font-medium">Activities & Tasks</Label>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const newActivity: Omit<TableActivity, "id"> = {
                                        type: "cleaning",
                                        status: "pending",
                                        estimatedDuration: 15,
                                        notes: "Manual cleaning task",
                                      }
                                      addActivity(selectedTable.number, newActivity)
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Task
                                  </Button>
                                </div>

                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {selectedTable.activities.map((activity) => (
                                    <div
                                      key={activity.id}
                                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        {getActivityIcon(activity.type)}
                                        <div>
                                          <div className="font-medium capitalize text-sm">{activity.type}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {activity.assignedTo && `Assigned to: ${activity.assignedTo}`}
                                          </div>
                                        </div>
                                        <Badge
                                          variant={
                                            activity.status === "completed"
                                              ? "default"
                                              : activity.status === "in-progress"
                                                ? "secondary"
                                                : "outline"
                                          }
                                          className="text-xs"
                                        >
                                          {activity.status}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2 w-full sm:w-auto">
                                        {activity.status === "in-progress" && (
                                          <Progress value={getActivityProgress(activity)} className="w-full sm:w-16" />
                                        )}

                                        <Select
                                          value={activity.status}
                                          onValueChange={(value: TableActivity["status"]) =>
                                            updateActivity(selectedTable.number, activity.id, { status: value })
                                          }
                                        >
                                          <SelectTrigger className="w-full sm:w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  ))}

                                  {selectedTable.activities.length === 0 && (
                                    <div className="text-center text-muted-foreground py-4 text-sm">
                                      No activities scheduled for this table
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                <Select
                                  value={selectedTable.status}
                                  onValueChange={(value: Table["status"]) =>
                                    updateTableStatus(selectedTable.number, value)
                                  }
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                    <SelectItem value="cleaning">Cleaning</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="setup">Setup</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-base">Table List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tables.map((table) => (
                  <div
                    key={table.number}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 gap-3"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(table.status)}
                        <span className="font-medium text-sm md:text-base">Table {table.number}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {table.status}
                      </Badge>
                      <span className="text-xs md:text-sm text-muted-foreground">{table.capacity} seats</span>
                      <span className="text-xs md:text-sm text-muted-foreground capitalize">{table.section}</span>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {table.currentOrder && (
                        <div className="text-right">
                          <div className="font-medium text-sm md:text-base">₹{table.currentOrder.total}</div>
                          <div className="text-xs text-muted-foreground">{table.estimatedTime}m left</div>
                        </div>
                      )}
                      <span className="text-xs md:text-sm text-muted-foreground">{table.server}</span>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{reservation.customerName}</div>
                    <div className="text-sm text-muted-foreground">Table {reservation.tableNumber}</div>
                  </div>
                  <div className="text-sm">
                    <div>{reservation.reservationTime.toLocaleTimeString()}</div>
                    <div className="text-muted-foreground">{reservation.partySize} guests</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-chart-2/20 border border-chart-2 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/20 border border-destructive rounded"></div>
              <span className="text-sm">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/20 border border-primary rounded"></div>
              <span className="text-sm">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-chart-4/20 border border-chart-4 rounded"></div>
              <span className="text-sm">Cleaning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-400 rounded"></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded"></div>
              <span className="text-sm">Setup</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
