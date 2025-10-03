"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { OrderCard } from "@/components/order-card"
import { AnalyticsCard } from "@/components/analytics-card"
import { MenuManagement } from "@/components/menu-management"
import { TableManagement } from "@/components/table-management"
import { KitchenDisplay } from "@/components/kitchen-display"
import { StaffManagement } from "@/components/staff-management"
import { PaymentConfirmation } from "@/components/payment-confirmation"
import { TableAssignmentPage } from "@/components/table-assignment-page"
import {
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Bell,
  LogOut,
  Activity,
  Store,
  ShoppingBag,
  Truck,
  CalendarCheck,
  ChefHat,
  TableIcon,
  ClipboardList,
  CreditCard,
  BarChart3,
  ListTree,
  Boxes,
} from "lucide-react"
import { useOrderManager } from "@/hooks/use-order-manager"
import { TakeawayManagement } from "@/components/takeaway-management"
import { ReservationManagement } from "@/components/reservation-management"
import { CounterOrderManagement } from "@/components/counter-order-management"
import { SectionHeader } from "@/components/section-header"
import { SidebarTrigger, SidebarRail } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar"
import { InventoryManagement } from "@/components/inventory-management"
import { DeliveryManagement } from "@/components/delivery-management"

export default function RestaurantDashboard() {
  const router = useRouter()
  const { orders, updateOrderStatus, getOrdersByStatus, getAnalytics } = useOrderManager()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuth")
    if (!isAuthenticated) {
      router.push("/admin/login")
    }
  }, [router])

  const [notifications, setNotifications] = useState<string[]>([
    "New voice order from Table 12",
    "Payment completed for Table 5",
    "New takeaway order #TK001 received",
    "Table reservation confirmed for 7:30 PM",
  ])

  const [active, setActive] = useState<
    | "orders"
    | "counter"
    | "takeaway"
    | "reservations"
    | "kitchen"
    | "tables"
    | "assignment"
    | "payment"
    | "analytics"
    | "menu"
    | "staff"
    | "inventory"
    | "delivery"
  >("orders")

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    router.push("/admin/login")
  }

  const handleOrderStatusUpdate = (orderId: number, newStatus: any) => {
    updateOrderStatus(orderId, newStatus)
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      setNotifications((prev) => [`Table ${order.tableNumber} order marked as ${newStatus}`, ...prev.slice(0, 4)])
    }
  }

  const pendingOrders = getOrdersByStatus("pending")
  const preparingOrders = getOrdersByStatus("preparing")
  const readyOrders = getOrdersByStatus("ready")
  const analytics = getAnalytics()

  const liveOrdersBadge = pendingOrders.length + preparingOrders.length

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar collapsible="icon" variant="inset" className="border-r">
          <SidebarHeader>
            <div className="px-2 py-1 flex items-center justify-start gap-2">
              <img src="/hey-paytm-logo.png" alt="Hey Paytm logo" className="w-8 h-8 rounded-lg shadow-sm" />
              <div className="text-sm group-data-[collapsible=icon]:hidden">
                <div className="font-semibold">Hey Paytm</div>
                <div className="text-xs text-muted-foreground">Dashboard</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {[
                { key: "orders", label: "Live Orders", icon: Activity, badge: liveOrdersBadge },
                { key: "counter", label: "Counter Orders", icon: Store },
                { key: "takeaway", label: "Takeaway", icon: ShoppingBag },
                { key: "delivery", label: "Delivery Orders", icon: Truck },
                { key: "reservations", label: "Reservations", icon: CalendarCheck },
                { key: "kitchen", label: "Kitchen Display", icon: ChefHat },
                { key: "tables", label: "Table Management", icon: TableIcon },
                { key: "assignment", label: "Table Assignment", icon: ClipboardList },
                { key: "payment", label: "Payment Confirmation", icon: CreditCard },
                { key: "analytics", label: "Analytics", icon: BarChart3 },
                { key: "menu", label: "Menu Management", icon: ListTree },
                { key: "inventory", label: "Inventory", icon: Boxes },
                { key: "staff", label: "Staff", icon: Users },
              ].map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={active === (item.key as any)}
                    onClick={() => setActive(item.key as any)}
                    title={item.label}
                    className="justify-start gap-3 data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10"
                  >
                    <item.icon className="w-4 h-4" aria-hidden="true" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {typeof item.badge !== "undefined" && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  title="Logout"
                  className="justify-start gap-3 hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarRail />
        <SidebarInset>
          <header className="bg-card border-b border-border p-4 lg:p-6">
            <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <img
                  src="/hey-paytm-logo.png"
                  alt="Hey Paytm logo"
                  className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-xl shadow-sm"
                />
                <div>
                  <h1 className="font-sans font-bold text-lg lg:text-xl xl:text-2xl text-foreground text-balance">
                    Hey Paytm Dashboard
                  </h1>
                  <p className="text-xs lg:text-sm text-muted-foreground">Restaurant Management System</p>
                </div>
              </div>
              <div className="flex items-center gap-3 lg:gap-4 flex-wrap sm:flex-nowrap">
                <ThemeToggle />
                <div className="relative">
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent text-sm lg:text-base">
                    <Bell className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                    Notifications
                    {notifications.length > 0 && (
                      <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                        {notifications.length}
                      </Badge>
                    )}
                  </Button>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm lg:text-base font-medium">Spice Garden Restaurant</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Online • 12 Tables Active</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-full bg-transparent text-sm lg:text-base"
                >
                  <LogOut className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
            <Tabs value={active} className="space-y-6 lg:space-y-8" onValueChange={(v) => setActive(v as any)}>
              <TabsContent value="orders" className="space-y-6">
                <SectionHeader title="Live Orders" subtitle="Monitor and manage real-time orders" />
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
                  <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 lg:p-6 xl:p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm lg:text-base text-muted-foreground">Pending Orders</p>
                          <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-destructive">
                            {pendingOrders.length}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-destructive" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 lg:p-6 xl:p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm lg:text-base text-muted-foreground">Preparing</p>
                          <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
                            {preparingOrders.length}
                          </p>
                        </div>
                        <Users className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-secondary-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 lg:p-6 xl:p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm lg:text-base text-muted-foreground">Ready to Serve</p>
                          <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-primary">
                            {readyOrders.length}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 lg:p-6 xl:p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm lg:text-base text-muted-foreground">Today's Revenue</p>
                          <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-accent">
                            ₹{analytics.totalRevenue}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-accent" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                  <div>
                    <h3 className="font-semibold text-lg lg:text-xl mb-4 text-destructive">
                      Pending Orders ({pendingOrders.length})
                    </h3>
                    <div className="space-y-4">
                      {pendingOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg lg:text-xl mb-4 text-foreground">
                      Preparing ({preparingOrders.length})
                    </h3>
                    <div className="space-y-4">
                      {preparingOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg lg:text-xl mb-4 text-primary">
                      Ready to Serve ({readyOrders.length})
                    </h3>
                    <div className="space-y-4">
                      {readyOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onStatusUpdate={handleOrderStatusUpdate} />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="counter" className="space-y-6">
                <SectionHeader title="Counter Orders" subtitle="Walk-in orders and billing" />
                <CounterOrderManagement />
              </TabsContent>

              <TabsContent value="takeaway" className="space-y-6">
                <SectionHeader title="Takeaway" subtitle="Manage pickup orders" />
                <TakeawayManagement />
              </TabsContent>

              <TabsContent value="delivery" className="space-y-6">
                <SectionHeader title="Delivery Orders" subtitle="Track and manage deliveries" />
                <DeliveryManagement />
              </TabsContent>

              <TabsContent value="reservations" className="space-y-6">
                <SectionHeader title="Reservations" subtitle="Handle bookings and guest info" />
                <ReservationManagement />
              </TabsContent>

              <TabsContent value="kitchen" className="space-y-6">
                <SectionHeader title="Kitchen Display" subtitle="Order queue for the kitchen" />
                <KitchenDisplay orders={orders} onStatusUpdate={handleOrderStatusUpdate} />
              </TabsContent>

              <TabsContent value="tables" className="space-y-6">
                <SectionHeader title="Table Management" subtitle="Layout, status, and seating" />
                <TableManagement orders={orders} />
              </TabsContent>

              <TabsContent value="assignment" className="space-y-6">
                <SectionHeader title="Table Assignment" subtitle="Assign and optimize seating" />
                <TableAssignmentPage />
              </TabsContent>

              <TabsContent value="payment" className="space-y-6">
                <SectionHeader title="Payment Confirmation" subtitle="Verify bills and settlements" />
                <PaymentConfirmation />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <SectionHeader title="Analytics" subtitle="Sales, items, and trends" />
                <AnalyticsCard orders={orders} />
              </TabsContent>

              <TabsContent value="menu" className="space-y-6">
                <SectionHeader title="Menu Management" subtitle="Items, categories, and availability" />
                <MenuManagement />
              </TabsContent>

              <TabsContent value="inventory" className="space-y-6">
                <SectionHeader title="Inventory" subtitle="Stock and low-supply alerts" />
                <InventoryManagement />
              </TabsContent>

              <TabsContent value="staff" className="space-y-6">
                <SectionHeader title="Staff" subtitle="Team overview and roles" />
                <StaffManagement />
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
