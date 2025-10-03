"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Users,
  DollarSign,
  Utensils,
  Calendar,
  Settings,
  Search,
  Trash2,
  Eye,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "order" | "reservation" | "staff" | "system" | "payment" | "inventory" | "maintenance"
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionRequired?: boolean
  relatedId?: string // Order ID, Table ID, Staff ID, etc.
  source?: string
  data?: any
}

interface NotificationSettings {
  soundEnabled: boolean
  desktopNotifications: boolean
  emailNotifications: boolean
  orderNotifications: boolean
  reservationNotifications: boolean
  staffNotifications: boolean
  systemNotifications: boolean
  paymentNotifications: boolean
  inventoryNotifications: boolean
  maintenanceNotifications: boolean
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n1",
      type: "order",
      priority: "high",
      title: "New Voice Order",
      message: "Table 12 placed a voice order for ₹850. Order includes 2x Butter Chicken, 1x Naan.",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      read: false,
      actionRequired: true,
      relatedId: "order-123",
      source: "Voice System",
    },
    {
      id: "n2",
      type: "reservation",
      priority: "medium",
      title: "Upcoming Reservation",
      message: "Rajesh Kumar's reservation for 4 people at 7:30 PM today. Table 15 reserved.",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      actionRequired: true,
      relatedId: "res-456",
      source: "Reservation System",
    },
    {
      id: "n3",
      type: "staff",
      priority: "medium",
      title: "Staff Break Alert",
      message: "Priya Sharma has been on break for 25 minutes. Lunch break limit is 30 minutes.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      read: false,
      actionRequired: true,
      relatedId: "staff-2",
      source: "Staff Management",
    },
    {
      id: "n4",
      type: "payment",
      priority: "low",
      title: "Payment Completed",
      message: "Table 8 payment of ₹1,250 completed successfully via UPI.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      read: true,
      actionRequired: false,
      relatedId: "payment-789",
      source: "Payment Gateway",
    },
    {
      id: "n5",
      type: "system",
      priority: "urgent",
      title: "Kitchen Display Offline",
      message: "Kitchen display system went offline. Orders may not be visible to kitchen staff.",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false,
      actionRequired: true,
      relatedId: "system-kitchen",
      source: "System Monitor",
    },
    {
      id: "n6",
      type: "inventory",
      priority: "high",
      title: "Low Stock Alert",
      message: "Chicken stock is running low (5 portions remaining). Consider restocking soon.",
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      read: false,
      actionRequired: true,
      relatedId: "inv-chicken",
      source: "Inventory System",
    },
    {
      id: "n7",
      type: "maintenance",
      priority: "medium",
      title: "Table Maintenance Due",
      message: "Table 20 is scheduled for maintenance check. Last serviced 30 days ago.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      actionRequired: true,
      relatedId: "table-20",
      source: "Maintenance Schedule",
    },
  ])

  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
    orderNotifications: true,
    reservationNotifications: true,
    staffNotifications: true,
    systemNotifications: true,
    paymentNotifications: false,
    inventoryNotifications: true,
    maintenanceNotifications: true,
  })

  const [filter, setFilter] = useState<"all" | "unread" | "urgent" | "action-required">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | Notification["type"]>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new notifications
      if (Math.random() > 0.8) {
        const newNotification = generateRandomNotification()
        setNotifications((prev) => [newNotification, ...prev])

        // Play sound if enabled
        if (settings.soundEnabled) {
          playNotificationSound(newNotification.priority)
        }

        // Show desktop notification if enabled
        if (settings.desktopNotifications) {
          showDesktopNotification(newNotification)
        }
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [settings])

  const generateRandomNotification = (): Notification => {
    const types: Notification["type"][] = ["order", "reservation", "staff", "payment", "system"]
    const priorities: Notification["priority"][] = ["low", "medium", "high"]
    const type = types[Math.floor(Math.random() * types.length)]

    const templates = {
      order: [
        "New order from Table {table} - ₹{amount}",
        "Order ready for Table {table}",
        "Order cancelled by Table {table}",
      ],
      reservation: [
        "New reservation for {guests} guests at {time}",
        "Reservation reminder: {name} arriving in 15 minutes",
        "Reservation cancelled: {name}",
      ],
      staff: [
        "{name} clocked in for {shift} shift",
        "{name} requested break extension",
        "Shift change: {name} replacing {name2}",
      ],
      payment: [
        "Payment received: ₹{amount} from Table {table}",
        "Payment failed for Table {table}",
        "Refund processed: ₹{amount}",
      ],
      system: ["System backup completed successfully", "Network connectivity restored", "Software update available"],
    }

    const messages = templates[type]
    const message = messages[Math.floor(Math.random() * messages.length)]

    return {
      id: `n${Date.now()}`,
      type,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Update`,
      message: message
        .replace("{table}", `${Math.floor(Math.random() * 24) + 1}`)
        .replace("{amount}", `${Math.floor(Math.random() * 2000) + 200}`)
        .replace("{guests}", `${Math.floor(Math.random() * 8) + 1}`)
        .replace("{time}", "7:30 PM")
        .replace("{name}", "Staff Member")
        .replace("{name2}", "Another Staff")
        .replace("{shift}", "evening"),
      timestamp: new Date(),
      read: false,
      actionRequired: Math.random() > 0.6,
      source: "System",
    }
  }

  const playNotificationSound = (priority: Notification["priority"]) => {
    // In a real app, you'd play different sounds based on priority
    console.log(`Playing ${priority} priority notification sound`)
  }

  const showDesktopNotification = (notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/hey-paytm-logo.png",
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return <Utensils className="w-4 h-4" />
      case "reservation":
        return <Calendar className="w-4 h-4" />
      case "staff":
        return <Users className="w-4 h-4" />
      case "payment":
        return <DollarSign className="w-4 h-4" />
      case "system":
        return <Settings className="w-4 h-4" />
      case "inventory":
        return <AlertTriangle className="w-4 h-4" />
      case "maintenance":
        return <Settings className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 border-red-300 text-red-800"
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800"
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return "bg-green-50 text-green-700"
      case "reservation":
        return "bg-blue-50 text-blue-700"
      case "staff":
        return "bg-purple-50 text-purple-700"
      case "payment":
        return "bg-emerald-50 text-emerald-700"
      case "system":
        return "bg-gray-50 text-gray-700"
      case "inventory":
        return "bg-orange-50 text-orange-700"
      case "maintenance":
        return "bg-indigo-50 text-indigo-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    // Apply filters
    if (filter === "unread" && notification.read) return false
    if (filter === "urgent" && notification.priority !== "urgent") return false
    if (filter === "action-required" && !notification.actionRequired) return false

    // Apply type filter
    if (typeFilter !== "all" && notification.type !== typeFilter) return false

    // Apply search
    if (
      searchQuery &&
      !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false

    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const urgentCount = notifications.filter((n) => n.priority === "urgent" && !n.read).length
  const actionRequiredCount = notifications.filter((n) => n.actionRequired && !n.read).length

  return (
    <div className="space-y-6">
      {/* Notification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Action Required</p>
                <p className="text-2xl font-bold text-orange-600">{actionRequiredCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="urgent">Urgent Only</SelectItem>
              <SelectItem value="action-required">Action Required</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="reservation">Reservations</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllNotifications}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">General Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Sound Notifications</Label>
                      <Switch
                        id="sound"
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, soundEnabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="desktop">Desktop Notifications</Label>
                      <Switch
                        id="desktop"
                        checked={settings.desktopNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, desktopNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email Notifications</Label>
                      <Switch
                        id="email"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="orders">Order Notifications</Label>
                      <Switch
                        id="orders"
                        checked={settings.orderNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, orderNotifications: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reservations">Reservation Notifications</Label>
                      <Switch
                        id="reservations"
                        checked={settings.reservationNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, reservationNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staff-notif">Staff Notifications</Label>
                      <Switch
                        id="staff-notif"
                        checked={settings.staffNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, staffNotifications: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-notif">System Notifications</Label>
                      <Switch
                        id="system-notif"
                        checked={settings.systemNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, systemNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inventory-notif">Inventory Notifications</Label>
                      <Switch
                        id="inventory-notif"
                        checked={settings.inventoryNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, inventoryNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 border-b hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-blue-50/50",
                  )}
                >
                  <div className={cn("p-2 rounded-full", getTypeColor(notification.type))}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                            {notification.title}
                          </h4>
                          <Badge variant="outline" className={cn("text-xs", getPriorityColor(notification.priority))}>
                            {notification.priority}
                          </Badge>
                          {notification.actionRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(notification.timestamp)} ago</span>
                          {notification.source && <span>• {notification.source}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
