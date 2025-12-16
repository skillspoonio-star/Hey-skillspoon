"use client"

import { useState, useEffect } from "react"
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

// Configuration constants
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? '₹'
const CURRENCY_LOCALE = process.env.NEXT_PUBLIC_CURRENCY_LOCALE ?? 'en-IN'
const DEFAULT_GROWTH_RATE = 0 // Default growth rate when no historical data
const POPULAR_ITEMS_LIMIT = 8
const PEAK_HOURS_LIMIT = 3

// Status colors configuration
const STATUS_COLORS: Record<string, string> = {
  served: '#60b246',
  ready: '#fc8019',
  preparing: '#f97316',
  pending: '#e23744'
}

const PAYMENT_COLORS: string[] = ['#fc8019', '#60b246', '#e23744', '#686b78']

export function AnalyticsCard({ orders }: AnalyticsCardProps) {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today")
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "orders" | "customers">("revenue")

  const [analytics, setAnalytics] = useState<any | null>(null)

  const [ordersData, setOrdersData] = useState<Order[] | null>(null)

  // Currency formatter
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: 'currency',
        currency: CURRENCY_SYMBOL === '₹' ? 'INR' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (e) {
      return `${CURRENCY_SYMBOL}${amount.toLocaleString()}`
    }
  }

  useEffect(() => {
    let mounted = true

    const range = timeRange === 'today' ? '24h' : timeRange
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

    // fetch analytics overview and recent orders in parallel. orders endpoint returns expanded item data.
    Promise.all([
      fetch(`${base}/api/analytics/overview?range=${range}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/api/orders`).then((r) => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(([analyticsRes, ordersRes]) => {
        if (!mounted) return
        if (analyticsRes) setAnalytics(analyticsRes)
        if (Array.isArray(ordersRes)) setOrdersData(ordersRes)
      })
      .catch((err) => console.error('Failed to load analytics or orders', err))
      .finally(() => { })

    return () => {
      mounted = false
    }
  }, [timeRange])

  // Calculate analytics data (use backend analytics when available; fall back to orders prop or fetched orders)
  const sourceOrders = ordersData ?? orders
  const totalRevenue = analytics && typeof analytics.totalRevenue !== 'undefined' ? analytics.totalRevenue : sourceOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalOrders = analytics && typeof analytics.totalOrders !== 'undefined' ? analytics.totalOrders : sourceOrders.length
  const avgOrderValue = analytics && typeof analytics.avgOrder !== 'undefined' ? Math.round(analytics.avgOrder || 0) : (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0)
  // voiceOrders: prefer analytics.voiceOrders, otherwise try to infer from orders (order.source==='voice' or order.isVoice)
  const voiceOrders = analytics && typeof analytics.voiceOrders !== 'undefined' ? analytics.voiceOrders : sourceOrders.filter((o: any) => o.source === 'voice' || o.isVoice === true || o.orderSource === 'voice').length || 0
  const uniqueCustomers = analytics && typeof analytics.uniqueCustomers !== 'undefined' ? analytics.uniqueCustomers : new Set(sourceOrders.map((o) => o.customerPhone)).size

  // Calculate growth metrics (use analytics data or default)
  const revenueGrowth = analytics?.growth?.revenue ?? DEFAULT_GROWTH_RATE
  const orderGrowth = analytics?.growth?.orders ?? DEFAULT_GROWTH_RATE
  const customerGrowth = analytics?.growth?.customers ?? DEFAULT_GROWTH_RATE

  // Helper to format hour numbers -> e.g. 13 -> "1 PM"
  // Convert a UTC hour bucket (0-23) to a localized hour label in IST.
  // We format the center of the bucket (hour:30) in 'Asia/Kolkata' so
  // that buckets like UTC 11 (which map to 16:30-17:29 IST) display as '5 PM'.
  const formatHourLabel = (h: number) => {
    const hour = Number(h);
    if (Number.isNaN(hour)) return String(h);
    const date = new Date(Date.UTC(2020, 0, 1, hour, 30, 0)); // center of the UTC hour
    return date.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' });
  }

  const parseRangeStart = (range: string) => {
    const now = new Date();
    if (!range || range === '24h' || range === 'today') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Derived datasets (prefer analytics; fall back to orders fetched from /api/orders)
  const ordersForAnalysis = (sourceOrders || []) as any[]

  // hourly: prefer analytics.hourly (which returns 24 buckets), otherwise derive from orders
  const hourlyData = analytics && analytics.hourly && Array.isArray(analytics.hourly)
    ? analytics.hourly.map((h: any) => {
      // backend uses hour like "9:00" — extract leading number
      const raw = String(h.hour || '0');
      const hourNum = parseInt(raw.split(':')[0], 10);
      return { hour: formatHourLabel(hourNum), revenue: h.revenue || 0, orders: h.orders || 0, customers: h.customers || 0 }
    })
    : (() => {
      // derive hourly buckets from orders
      const buckets: Record<number, { revenue: number; orders: number; customersSet: Set<string> }> = {};
      for (let i = 0; i < 24; i++) buckets[i] = { revenue: 0, orders: 0, customersSet: new Set() };
      for (const o of ordersForAnalysis) {
        const d = new Date((o as any).timestamp || (o as any).createdAt || Date.now());
        // Use UTC hour to match backend aggregation (Mongo $hour uses UTC by default)
        const h = d.getUTCHours();
        buckets[h].revenue += Number(o.total || 0);
        buckets[h].orders += 1;
        if (o.customerPhone) buckets[h].customersSet.add(String(o.customerPhone));
      }
      return Object.keys(buckets).map((k) => ({ hour: formatHourLabel(Number(k)), revenue: buckets[Number(k)].revenue, orders: buckets[Number(k)].orders, customers: buckets[Number(k)].customersSet.size }));
    })()

  // weekly/daily trend: if analytics doesn't provide daily data, derive from orders
  const weeklyData = (() => {
    if (timeRange === 'today') return hourlyData;
    // create map of day names (Mon..Sun) for last 7 days
    const start = parseRangeStart(timeRange === 'month' ? 'month' : 'week');
    const dayMap: Record<string, { revenue: number; orders: number; customersSet: Set<string> }> = {};
    const dayLabels: string[] = [];
    for (let i = 0; i < (timeRange === 'month' ? 30 : 7); i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      // Use UTC weekday to align with server-side aggregation
      const label = d.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
      dayLabels.push(label);
      dayMap[label] = { revenue: 0, orders: 0, customersSet: new Set() };
    }
    for (const o of ordersForAnalysis) {
      const t = new Date((o as any).timestamp || (o as any).createdAt || Date.now());
      if (t < start) continue;
      const label = t.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
      if (!dayMap[label]) continue;
      dayMap[label].revenue += Number(o.total || 0);
      dayMap[label].orders += 1;
      if (o.customerPhone) dayMap[label].customersSet.add(String(o.customerPhone));
    }
    return dayLabels.map((l) => ({ day: l, revenue: dayMap[l].revenue, orders: dayMap[l].orders, customers: dayMap[l].customersSet.size }));
  })()

  // status distribution

  const statusData = analytics && analytics.statusCounts
    ? Object.entries(analytics.statusCounts).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || '#686b78' }))
    : [
      { name: 'Served', value: ordersForAnalysis.filter((o: any) => o.status === 'served').length, color: STATUS_COLORS.served },
      { name: 'Ready', value: ordersForAnalysis.filter((o: any) => o.status === 'ready').length, color: STATUS_COLORS.ready },
      { name: 'Preparing', value: ordersForAnalysis.filter((o: any) => o.status === 'preparing').length, color: STATUS_COLORS.preparing },
      { name: 'Pending', value: ordersForAnalysis.filter((o: any) => o.status === 'pending').length, color: STATUS_COLORS.pending },
    ]

  // payment methods
  const paymentData = analytics && analytics.paymentMethods
    ? Object.entries(analytics.paymentMethods).map(([name, value], i) => ({ name, value, color: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }))
    : []

  // popular items
  const popularItems = analytics && Array.isArray(analytics.popular) && analytics.popular.length
    ? analytics.popular.map((p: any) => ({ name: p.name || `item-${p.itemId}`, count: p.quantity || 0, revenue: (p.price || 0) * (p.quantity || 0) }))
    : (() => {
      // derive from orders (orders endpoint expands item names)
      const counts: Record<string, { count: number; price: number }> = {};
      for (const o of ordersForAnalysis) {
        for (const it of o.items || []) {
          const item = it as any
          const name = item.name || `item-${item.itemId}`;
          counts[name] = counts[name] || { count: 0, price: item.price || 0 };
          counts[name].count += Number(item.quantity || 0);
          if (!counts[name].price && item.price) counts[name].price = item.price;
        }
      }
      return Object.entries(counts).sort(([, a], [, b]) => b.count - a.count).slice(0, POPULAR_ITEMS_LIMIT).map(([name, c]) => ({ name, count: c.count, revenue: c.count * (c.price || 0) }));
    })()

  const orderTypeData = [
    { name: 'Voice Orders', value: voiceOrders, color: '#fc8019' },
    { name: 'Manual Orders', value: Math.max(0, totalOrders - voiceOrders), color: '#60b246' },
  ]

  // Peak hours
  const peakHours = (hourlyData || []).slice().sort((a: any, b: any) => b.revenue - a.revenue).slice(0, PEAK_HOURS_LIMIT).map((h: any) => h.hour)

  const currentData = timeRange === 'today' ? hourlyData : weeklyData

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-hidden">
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                <p className="text-lg font-bold mb-1 truncate" title={formatCurrency(totalRevenue)}>
                  {formatCurrency(totalRevenue)}
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-green-500">+{revenueGrowth}%</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Orders</p>
                <p className="text-lg font-bold mb-1 truncate">{totalOrders}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-blue-500">+{orderGrowth}%</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Avg Order</p>
                <p className="text-lg font-bold mb-1 truncate" title={formatCurrency(avgOrderValue)}>
                  {formatCurrency(avgOrderValue)}
                </p>
                <div className="flex items-center gap-1">
                  {orderGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {orderGrowth > 0 ? `+${orderGrowth}%` : orderGrowth < 0 ? `${orderGrowth}%` : '0%'}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Customers</p>
                <p className="text-lg font-bold mb-1 truncate">{uniqueCustomers}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-purple-500 flex-shrink-0" />
                  <span className="text-xs text-purple-500">+{customerGrowth}%</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Voice Orders</p>
                <p className="text-lg font-bold mb-1 truncate">{voiceOrders}</p>
                <p className="text-xs text-muted-foreground">
                  {totalOrders > 0 ? Math.round((voiceOrders / totalOrders) * 100) : 0}% of total
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Peak Hour</p>
                <p className="text-lg font-bold mb-1 truncate">{peakHours[0] || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Highest revenue</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-red-500" />
              </div>
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
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
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
              <CardContent className="pt-6">
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
                        selectedMetric === "revenue" ? formatCurrency(Number(value)) : value,
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
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Revenue vs Orders</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Customer Flow</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Status Distribution */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        labelFormatter={() => ''}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Custom Legend */}
                  <div className="grid grid-cols-2 gap-2">
                    {statusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground truncate">
                          {entry.name}: {String(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {paymentData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={paymentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                          labelFormatter={() => ''}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Custom Legend */}
                    <div className="grid grid-cols-2 gap-2">
                      {paymentData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-muted-foreground truncate">
                            {entry.name}: {String(entry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <p className="text-sm">No payment data available</p>
                      <p className="text-xs mt-1">Payment methods will appear here when orders are processed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Types */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Order Types</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={orderTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        labelFormatter={() => ''}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Custom Legend */}
                  <div className="grid grid-cols-1 gap-2">
                    {orderTypeData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {entry.name}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {entry.value} ({totalOrders > 0 ? Math.round((entry.value / totalOrders) * 100) : 0}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Items */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Top Performing Items</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {popularItems.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.revenue)} revenue</p>
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
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Peak Performance Hours</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {peakHours.map((hour: string, index: number) => {
                    const hourData = (hourlyData as any[]).find((h: any) => h.hour === hour)
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
                          <span className="font-bold text-primary">{formatCurrency(hourData?.revenue || 0)}</span>
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
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
                        {customerGrowth > 0 ? `${customerGrowth}% increase` : customerGrowth < 0 ? `${Math.abs(customerGrowth)}% decrease` : 'No change'} in unique customers. {customerGrowth > 0 ? 'Retention programs working well.' : customerGrowth < 0 ? 'Consider improving retention strategies.' : 'Customer base is stable.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Optimize Staff Schedule</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Increase staff during 7-8 PM peak hours to handle 22+ orders efficiently.
                    </p>
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      High Impact
                    </Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Promote Combo Meals</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create value combos to increase AOV and compete with declining individual item sales.
                    </p>
                    <Badge variant="outline" className="px-2 py-1 text-xs">
                      Medium Impact
                    </Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Voice Order Incentives</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Offer small discounts for voice orders to push adoption beyond 75%.
                    </p>
                    <Badge variant="outline" className="px-2 py-1 text-xs">
                      Low Impact
                    </Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Expand Popular Items</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Consider variations of Chicken Biryani and Dal Makhani to capitalize on popularity.
                    </p>
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
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
