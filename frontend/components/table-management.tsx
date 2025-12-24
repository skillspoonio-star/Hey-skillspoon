"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useToast } from "@/components/providers/toast-provider"

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
  isCleaning: boolean
  isMaintenance: boolean
  isSetup: boolean
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
  const { success, error, warning, info } = useToast()
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

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
  const [tables, setTables] = useState<Table[]>([])
  const [tablesLoadError, setTablesLoadError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; table?: Table | null }>({ open: false, table: null })

  // Add Table dialog state (inline)
  const [addOpen, setAddOpen] = useState(false)
  const [addNumber, setAddNumber] = useState<number | ''>('')
  const [addCapacity, setAddCapacity] = useState<number | ''>('')
  const [addSection, setAddSection] = useState<'main' | 'patio' | 'private' | 'bar'>('main')
  const [addReservationPrice, setAddReservationPrice] = useState<number | ''>('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // fetch tables from backend on mount
  useEffect(() => {
    let mounted = true
    const fetchTables = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tables`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        // normalize server data into Table[] shape expected by component
        const normalized: Table[] = (Array.isArray(data) ? data : []).map((t: any) => ({
          number: Number(t.number),
          capacity: Number(t.capacity || 4),
          status: t.status || 'available',
          currentOrder: t.currentOrder || undefined,
          estimatedTime: t.estimatedTime || undefined,
          reservationName: t.reservationName || undefined,
          reservationPhone: t.reservationPhone || undefined,
          reservationTime: t.reservationTime ? new Date(t.reservationTime) : undefined,
          section: t.section || 'main',
          server: t.server || undefined,
          isCleaning: t.status === 'cleaning',
          isMaintenance: t.status === 'maintenance',
          isSetup: t.status === 'setup',
          lastCleaned: t.lastCleaned ? new Date(t.lastCleaned) : undefined,
          nextMaintenance: t.nextMaintenance ? new Date(t.nextMaintenance) : undefined,
        }))
        if (!mounted) return
        setTables(normalized)
      } catch (err: any) {
        console.error('Failed to load tables', err)
        setTablesLoadError(err?.message || 'Failed to load tables')
        // fallback: keep empty list, UI will still work with generated reservations
      }
    }
    fetchTables()

    // subscribe to SSE stream for updates
    let es: EventSource | null = null
    try {
      es = new EventSource(`${API_BASE}/api/tables/stream`)
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          if (payload && payload.tables) {
            const normalized: Table[] = payload.tables.map((t: any) => ({
              number: Number(t.number),
              capacity: Number(t.capacity || 4),
              status: t.status || 'available',
              currentOrder: t.currentOrder || undefined,
              estimatedTime: t.estimatedTime || undefined,
              reservationName: t.reservationName || undefined,
              reservationPhone: t.reservationPhone || undefined,
              reservationTime: t.reservationTime ? new Date(t.reservationTime) : undefined,
              section: t.section || 'main',
              server: t.server || undefined,
              isCleaning: Boolean(t.isCleaning),
              isMaintenance: Boolean(t.isMaintenance),
              isSetup: Boolean(t.isSetup),
              lastCleaned: t.lastCleaned ? new Date(t.lastCleaned) : undefined,
              nextMaintenance: t.nextMaintenance ? new Date(t.nextMaintenance) : undefined,
            }))
            setTables(normalized)
          }
        } catch (e) {
          // ignore non-JSON messages
        }
      }
      es.onerror = () => {
        // on error, close and retry later (browser will auto-retry for EventSource)
        if (es) {
          try { es.close() } catch (e) { }
        }
      }
    } catch (e) {
      // EventSource not available in this environment (SSR) or blocked; ignore
    }

    return () => {
      mounted = false
      if (es) {
        try { es.close() } catch (e) { }
      }
    }
  }, [API_BASE])

  const updateTableStatus = (tableNumber: number, newStatus: Table["status"]) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.number === tableNumber) {
          return { ...table, status: newStatus }
        }
        return table
      }),
    )
  }

  const toggleTask = async (tableNumber: number, taskType: 'cleaning' | 'maintenance' | 'setup') => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.number === tableNumber) {
          // Check if another activity is already active
          const hasActiveActivity = table.isCleaning || table.isMaintenance || table.isSetup
          const isCurrentActivity =
            (taskType === 'cleaning' && table.isCleaning) ||
            (taskType === 'maintenance' && table.isMaintenance) ||
            (taskType === 'setup' && table.isSetup)

          // If trying to start a new activity while another is active
          if (hasActiveActivity && !isCurrentActivity) {
            let activeActivity = ''

            warning(`Table is under ${activeActivity} right now`, 'Table Unavailable')
            return table
          }

          const updates: Partial<Table> = {}

          if (taskType === 'cleaning') {
            const newCleaningState = !table.isCleaning
            updates.isCleaning = newCleaningState
            updates.isMaintenance = false
            updates.isSetup = false
            updates.status = newCleaningState ? 'cleaning' : 'available'
          } else if (taskType === 'maintenance') {
            const newMaintenanceState = !table.isMaintenance
            updates.isMaintenance = newMaintenanceState
            updates.isCleaning = false
            updates.isSetup = false
            updates.status = newMaintenanceState ? 'maintenance' : 'available'
          } else if (taskType === 'setup') {
            const newSetupState = !table.isSetup
            updates.isSetup = newSetupState
            updates.isCleaning = false
            updates.isMaintenance = false
            updates.status = newSetupState ? 'setup' : 'available'
          }

          const updatedTable = { ...table, ...updates }

          // Update selectedTable if it's the same table
          if (selectedTable && selectedTable.number === tableNumber) {
            setSelectedTable(updatedTable)
          }

          // Update backend
          updateTableInBackend(tableNumber, updates, taskType)

          return updatedTable
        }
        return table
      }),
    )
  }

  const updateTableInBackend = async (tableNumber: number, updates: Partial<Table>, taskType: 'cleaning' | 'maintenance' | 'setup') => {
    try {
      // Update table status in backend
      const res = await fetch(`${API_BASE}/api/tables/${tableNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updates.status,
          isCleaning: updates.isCleaning,
          isMaintenance: updates.isMaintenance,
          isSetup: updates.isSetup
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Status ${res.status} ${txt}`)
      }

      // If starting a new activity, create activity record
      if (updates.status && updates.status !== 'available') {
        const activityData = {
          type: taskType,
          status: 'in-progress',
          estimatedDuration: taskType === 'cleaning' ? 15 : taskType === 'maintenance' ? 30 : 10,
          notes: `Table ${taskType} started`,
          startTime: new Date().toISOString()
        }

        const activityRes = await fetch(`${API_BASE}/api/tables/${tableNumber}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activityData)
        })

        if (!activityRes.ok) {
          console.error('Failed to create activity:', await activityRes.text())
        }
      }

    } catch (err: any) {
      console.error('Failed to update table in backend:', err)
      // Don't show alert to user as frontend state is already updated
    }
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
  const cleaningTasks = tables.filter((t) => t.isCleaning).length
  const maintenanceTasks = tables.filter((t) => t.isMaintenance).length
  const setupTasks = tables.filter((t) => t.isSetup).length

  const totalRevenue = orders.filter((order) => order.status === "served").reduce((sum, order) => sum + order.total, 0)

  const averageTableTurnover = occupiedTables > 0 ? Math.round(totalRevenue / occupiedTables) : 0

  return (
    <div className="space-y-6">
      {/* Enhanced Table Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Utensils className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500">{availableTables}</p>
                <p className="text-xs text-muted-foreground">Ready to use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <Users className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500">{occupiedTables}</p>
                <p className="text-xs text-muted-foreground">Currently dining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reserved</p>
                <p className="text-3xl font-bold text-primary">{reservedTables}</p>
                <p className="text-xs text-muted-foreground">Upcoming bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Cleaning</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{cleaningTables}</p>
                <p className="text-xs text-muted-foreground">Being cleaned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                  {Math.round((occupiedTables / tables.length) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Current rate</p>
              </div>
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
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Table</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Table Number</Label>
                  <Input value={addNumber} onChange={(e: any) => setAddNumber(Number(e.target.value || ''))} type="number" />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input value={addCapacity} onChange={(e: any) => setAddCapacity(Number(e.target.value || ''))} type="number" />
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={addSection} onValueChange={(v: any) => setAddSection(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="patio">Patio</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reservation Price</Label>
                  <Input value={addReservationPrice} onChange={(e: any) => setAddReservationPrice(Number(e.target.value || ''))} type="number" />
                </div>

                {addError && <p className="text-sm text-red-600">{addError}</p>}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    setAddError(null)
                    if (!addNumber || !addCapacity || addReservationPrice === '') { setAddError('Please fill required fields'); return }
                    setAddLoading(true)
                    try {
                      const res = await fetch(`${API_BASE}/api/tables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: addNumber, capacity: addCapacity, section: addSection, reservationPrice: addReservationPrice }) })
                      if (!res.ok) { const txt = await res.text(); throw new Error(`Status ${res.status} ${txt}`) }
                      const created = await res.json()
                      setAddOpen(false)
                      setAddNumber('')
                      setAddCapacity('')
                      setAddReservationPrice('')
                    } catch (err: any) { setAddError(err?.message || 'Failed') } finally { setAddLoading(false) }
                  }} disabled={addLoading}>{addLoading ? 'Creating...' : 'Create Table'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "activities" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {tables.filter(table => table.isCleaning || table.isMaintenance || table.isSetup).map((table) => (
              <Card key={table.number}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm md:text-base">Table {table.number}</span>
                        <Badge variant="outline" className="text-xs">
                          {table.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex gap-2">
                        {table.isCleaning && (
                          <Badge variant="default" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Cleaning
                          </Badge>
                        )}
                        {table.isMaintenance && (
                          <Badge variant="default" className="text-xs">
                            <Wrench className="w-3 h-3 mr-1" />
                            Maintenance
                          </Badge>
                        )}
                        {table.isSetup && (
                          <Badge variant="default" className="text-xs">
                            <QrCode className="w-3 h-3 mr-1" />
                            Setup
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {tables.filter(table => table.isCleaning || table.isMaintenance || table.isSetup).length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No active tasks
              </div>
            )}
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
                    .map((table, idx) => (
                      <Dialog key={table.number} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <div
                            className={cn(
                              "relative p-3 md:p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer",
                              getTableStatusColor(table.status)
                            )}
                            onClick={() => setSelectedTable(table)}
                          >
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">{getStatusIcon(table.status)}</div>
                              <div className="font-bold text-sm md:text-base dark:text-white">T{table.number}</div>
                              <div className="text-xs opacity-75 dark:text-gray-200">{table.capacity} seats</div>

                              {(table.isCleaning || table.isMaintenance || table.isSetup) && (
                                <div className="mt-2">
                                  <div className="flex justify-center gap-1">
                                    {table.isCleaning && (
                                      <div className="w-2 h-2 rounded-full bg-orange-500" title="Cleaning" />
                                    )}
                                    {table.isMaintenance && (
                                      <div className="w-2 h-2 rounded-full bg-blue-500" title="Maintenance" />
                                    )}
                                    {table.isSetup && (
                                      <div className="w-2 h-2 rounded-full bg-purple-500" title="Setup" />
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
                                  <Select
                                    value={selectedTable.section}
                                    onValueChange={async (value: string) => {
                                      try {
                                        const res = await fetch(`${API_BASE}/api/tables/${selectedTable.number}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ section: value })
                                        })

                                        if (!res.ok) {
                                          const txt = await res.text()
                                          throw new Error(`Status ${res.status} ${txt}`)
                                        }

                                        // Update local state
                                        setTables((prev) =>
                                          prev.map((table) =>
                                            table.number === selectedTable.number
                                              ? { ...table, section: value as Table['section'] }
                                              : table
                                          )
                                        )

                                        // Update selected table
                                        setSelectedTable({ ...selectedTable, section: value as Table['section'] })
                                      } catch (err: any) {
                                        console.error('Failed to update table section:', err)
                                        error(`Failed to update section: ${err.message}`, 'Update Failed')
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="main">Main</SelectItem>
                                      <SelectItem value="patio">Patio</SelectItem>
                                      <SelectItem value="private">Private</SelectItem>
                                      <SelectItem value="bar">Bar</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={selectedTable.isCleaning ? "default" : "outline"}
                                      onClick={() => toggleTask(selectedTable.number, 'cleaning')}
                                    >
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      {selectedTable.isCleaning ? 'Mark Cleaning Done' : 'Start Cleaning'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedTable.isMaintenance ? "default" : "outline"}
                                      onClick={() => toggleTask(selectedTable.number, 'maintenance')}
                                    >
                                      <Wrench className="w-4 h-4 mr-2" />
                                      {selectedTable.isMaintenance ? 'Mark Maintenance Done' : 'Start Maintenance'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedTable.isSetup ? "default" : "outline"}
                                      onClick={() => toggleTask(selectedTable.number, 'setup')}
                                    >
                                      <QrCode className="w-4 h-4 mr-2" />
                                      {selectedTable.isSetup ? 'Mark Setup Done' : 'Start Setup'}
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {selectedTable.isCleaning && (
                                    <div className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="font-medium text-gray-600">Currently Cleaning</span>
                                        <Badge variant="default">Active</Badge>
                                      </div>
                                    </div>
                                  )}

                                  {selectedTable.isMaintenance && (
                                    <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                                      <div className="flex items-center gap-2">
                                        <Wrench className="w-4 h-4" />
                                        <span className="font-medium text-gray-600">Currently Under Maintenance</span>
                                        <Badge variant="default">Active</Badge>
                                      </div>
                                    </div>
                                  )}

                                  {selectedTable.isSetup && (
                                    <div className="p-3 border rounded-lg bg-purple-50 border-purple-200">
                                      <div className="flex items-center gap-2">
                                        <QrCode className="w-4 h-4" />
                                        <span className="font-medium text-gray-600">Currently Setting Up</span>
                                        <Badge variant="default">Active</Badge>
                                      </div>
                                    </div>
                                  )}

                                  {!selectedTable.isCleaning && !selectedTable.isMaintenance && !selectedTable.isSetup && (
                                    <div className="p-3 border rounded-lg bg-gray-50 border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">No active tasks</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setConfirmDelete({ open: true, table: selectedTable })}
                                >
                                  Delete Table
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
