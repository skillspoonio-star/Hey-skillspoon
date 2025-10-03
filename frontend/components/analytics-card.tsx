"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, Users, Calendar, Download } from "lucide-react"
import type { Order } from "@/hooks/use-order-manager"

interface AnalyticsCardProps {
  orders: Order[]
}

export function AnalyticsCard({ orders }: AnalyticsCardProps) {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today")
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "orders" | "customers">("revenue")

  // Calculate analytics data
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  const voiceOrders = Math.floor(totalOrders * 0.72) // 72% voice orders
  const uniqueCustomers = new Set(orders.map((o) => o.customerPhone)).size

  // Calculate growth metrics (mock data for demo)
  const revenueGrowth = 12.5
  const orderGrowth = 8.3
  const customerGrowth = 15.2

  // Popular items analysis
  const itemCounts = orders.reduce(
    (acc, order) => {
      order.items.forEach((item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity
      })
      return acc
    },
    {} as Record<string, number>,
  )

  const popularItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count, revenue: count * 250 })) // Estimated revenue per item

  // Revenue by hour with realistic data
  const hourlyData = [
    { hour: "9 AM", revenue: 450, orders: 3, customers: 8 },
    { hour: "10 AM", revenue: 680, orders: 5, customers: 12 },
    { hour: "11 AM", revenue: 920, orders: 7, customers: 18 },
    { hour: "12 PM", revenue: 1850, orders: 12, customers: 28 },
    { hour: "1 PM", revenue: 2400, orders: 16, customers: 35 },
    { hour: "2 PM", revenue: 2100, orders: 14, customers: 32 },
    { hour: "3 PM", revenue: 1200, orders: 8, customers: 20 },
    { hour: "4 PM", revenue: 800, orders: 5, customers: 15 },
    { hour: "5 PM", revenue: 1600, orders: 10, customers: 25 },
    { hour: "6 PM", revenue: 2800, orders: 18, customers: 42 },
    { hour: "7 PM", revenue: 3500, orders: 22, customers: 48 },
    { hour: "8 PM", revenue: 3200, orders: 20, customers: 45 },
    { hour: "9 PM", revenue: 2600, orders: 16, customers: 38 },
    { hour: "10 PM", revenue: 1800, orders: 11, customers: 25 },
  ]

  // Weekly trend data
  const weeklyData = [
    { day: "Mon", revenue: 15200, orders: 85, customers: 180 },
    { day: "Tue", revenue: 18400, orders: 102, customers: 220 },
    { day: "Wed", revenue: 16800, orders: 94, customers: 195 },
    { day: "Thu", revenue: 21200, orders: 118, customers: 250 },
    { day: "Fri", revenue: 28500, orders: 156, customers: 320 },
    { day: "Sat", revenue: 32100, orders: 175, customers: 380 },
    { day: "Sun", revenue: 26800, orders: 148, customers: 295 },
  ]

  // Order status distribution
  const statusData = [
    { name: "Served", value: orders.filter((o) => o.status === "served").length, color: "#60b246" },
    { name: "Ready", value: orders.filter((o) => o.status === "ready").length, color: "#fc8019" },
    { name: "Preparing", value: orders.filter((o) => o.status === "preparing").length, color: "#f97316" },
    { name: "Pending", value: orders.filter((o) => o.status === "pending").length, color: "#e23744" },
  ]

  // Payment method distribution
  const paymentData = [
    { name: "Digital Wallet", value: 45, color: "#fc8019" },
    { name: "Card", value: 30, color: "#60b246" },
    { name: "Cash", value: 20, color: "#e23744" },
    { name: "UPI", value: 5, color: "#686b78" },
  ]

  // Order type distribution
  const orderTypeData = [
    { name: "Voice Orders", value: voiceOrders, color: "#fc8019" },
    { name: "Manual Orders", value: totalOrders - voiceOrders, color: "#60b246" },
  ]

  // Peak hours analysis
  const peakHours = hourlyData
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((hour) => hour.hour)

  const currentData = timeRange === "today" ? hourlyData : weeklyData

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Restaurant performance insights and metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-chart-2" />
              <span className="text-xs text-chart-2">+{revenueGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold text-secondary">{totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-secondary" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-chart-2" />
              <span className="text-xs text-chart-2">+{orderGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order</p>
                <p className="text-2xl font-bold text-accent">₹{avgOrderValue}</p>
              </div>
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive">-2.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold text-chart-2">{uniqueCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-chart-2" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-chart-2" />
              <span className="text-xs text-chart-2">+{customerGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Voice Orders</p>
                <p className="text-2xl font-bold text-primary">{voiceOrders}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">72% of total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-bold text-destructive">{peakHours[0]}</p>
              </div>
              <Clock className="w-8 h-8 text-destructive" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Highest revenue</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {timeRange === "today" ? "Hourly" : "Daily"}{" "}
                    {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend
                  </CardTitle>
                  <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={currentData}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fc8019" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#fc8019" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={timeRange === "today" ? "hour" : "day"} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        selectedMetric === "revenue" ? `₹${value}` : value,
                        selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#fc8019"
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue vs Orders Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={timeRange === "today" ? "hour" : "day"} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#fc8019" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#60b246" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Flow */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={timeRange === "today" ? "hour" : "day"} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, "Customers"]} />
                    <Bar dataKey="customers" fill="#60b246" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Types */}
            <Card>
              <CardHeader>
                <CardTitle>Order Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">₹{item.revenue.toLocaleString()} revenue</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.count} sold</span>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(item.count / popularItems[0].count) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Performance Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {peakHours.map((hour, index) => {
                    const hourData = hourlyData.find((h) => h.hour === hour)
                    return (
                      <div key={hour} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={index === 0 ? "default" : "secondary"}
                            className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div>
                            <span className="font-medium">{hour}</span>
                            <p className="text-xs text-muted-foreground">{hourData?.orders} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary">₹{hourData?.revenue.toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">{hourData?.customers} customers</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-chart-2/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-chart-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-chart-2">Voice Orders Trending Up</p>
                      <p className="text-sm text-muted-foreground">
                        72% of orders are now voice-based, up 15% from last month
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-primary">Peak Hours Identified</p>
                      <p className="text-sm text-muted-foreground">
                        7-8 PM generates 18% of daily revenue. Consider staff optimization.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Average Order Value Declining</p>
                      <p className="text-sm text-muted-foreground">
                        AOV down 2.1%. Consider upselling strategies or combo offers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                    <Users className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-accent">Customer Growth Strong</p>
                      <p className="text-sm text-muted-foreground">
                        15.2% increase in unique customers. Retention programs working well.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Optimize Staff Schedule</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Increase staff during 7-8 PM peak hours to handle 22+ orders efficiently.
                    </p>
                    <Badge variant="secondary" size="sm">
                      High Impact
                    </Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Promote Combo Meals</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create value combos to increase AOV and compete with declining individual item sales.
                    </p>
                    <Badge variant="outline" size="sm">
                      Medium Impact
                    </Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Voice Order Incentives</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Offer small discounts for voice orders to push adoption beyond 75%.
                    </p>
                    <Badge variant="outline" size="sm">
                      Low Impact
                    </Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Expand Popular Items</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Consider variations of Chicken Biryani and Dal Makhani to capitalize on popularity.
                    </p>
                    <Badge variant="secondary" size="sm">
                      High Impact
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
