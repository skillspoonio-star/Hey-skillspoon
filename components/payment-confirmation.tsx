"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Search, DollarSign, AlertTriangle, Filter, CreditCard, Banknote } from "lucide-react"
import { realTimeSync } from "@/lib/real-time-sync"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PendingPayment {
  id: number
  tableNumber: number
  customerPhone: string
  total: number
  paymentMethod: "cash" | "qr"
  timestamp: Date
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  status: "pending" | "confirmed"
}

export function PaymentConfirmation() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([
    // Mock data for demonstration
    {
      id: 1,
      tableNumber: 4,
      customerPhone: "9876543210",
      total: 850,
      paymentMethod: "cash",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      items: [
        { name: "Chicken Biryani", quantity: 1, price: 350 },
        { name: "Dal Makhani", quantity: 1, price: 250 },
        { name: "Butter Naan", quantity: 2, price: 60 },
        { name: "Mango Lassi", quantity: 1, price: 120 },
      ],
      status: "pending",
    },
    {
      id: 2,
      tableNumber: 7,
      customerPhone: "9123456789",
      total: 1200,
      paymentMethod: "cash",
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      items: [
        { name: "Paneer Tikka", quantity: 2, price: 300 },
        { name: "Chicken Biryani", quantity: 1, price: 350 },
        { name: "Gulab Jamun", quantity: 2, price: 80 },
      ],
      status: "pending",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All Methods")
  const [confirmedPayments, setConfirmedPayments] = useState<PendingPayment[]>([])

  const todaysPayments = confirmedPayments.length
  const todaysRevenue = confirmedPayments.reduce((sum, p) => sum + p.total, 0)
  const cashPayments = confirmedPayments.filter((p) => p.paymentMethod === "cash").length
  const qrPayments = confirmedPayments.filter((p) => p.paymentMethod === "qr").length

  useEffect(() => {
    // Listen for new cash payment requests
    const unsubscribe = realTimeSync.onCashPaymentRequest((paymentData) => {
      const newPayment: PendingPayment = {
        id: Date.now(),
        tableNumber: paymentData.tableNumber,
        customerPhone: paymentData.customerPhone,
        total: paymentData.total,
        paymentMethod: "cash",
        timestamp: new Date(),
        items: paymentData.items,
        status: "pending",
      }
      setPendingPayments((prev) => [newPayment, ...prev])
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (confirmedPayments.length === 0) {
      const now = new Date()
      const samples: PendingPayment[] = [
        // last 7 days examples
        {
          id: 1001,
          tableNumber: 2,
          customerPhone: "9000000001",
          total: 560,
          paymentMethod: "qr",
          timestamp: new Date(now.getTime() - 1 * 86400000),
          items: [],
          status: "confirmed",
        },
        {
          id: 1002,
          tableNumber: 5,
          customerPhone: "9000000002",
          total: 840,
          paymentMethod: "cash",
          timestamp: new Date(now.getTime() - 1 * 86400000),
          items: [],
          status: "confirmed",
        },
        {
          id: 1003,
          tableNumber: 3,
          customerPhone: "9000000003",
          total: 1260,
          paymentMethod: "qr",
          timestamp: new Date(now.getTime() - 2 * 86400000),
          items: [],
          status: "confirmed",
        },
        {
          id: 1004,
          tableNumber: 9,
          customerPhone: "9000000004",
          total: 740,
          paymentMethod: "cash",
          timestamp: new Date(now.getTime() - 3 * 86400000),
          items: [],
          status: "confirmed",
        },
        {
          id: 1005,
          tableNumber: 7,
          customerPhone: "9000000005",
          total: 1120,
          paymentMethod: "qr",
          timestamp: new Date(now.getTime() - 4 * 86400000),
          items: [],
          status: "confirmed",
        },
        {
          id: 1006,
          tableNumber: 1,
          customerPhone: "9000000006",
          total: 960,
          paymentMethod: "cash",
          timestamp: new Date(now.getTime() - 5 * 86400000),
          items: [],
          status: "confirmed",
        },
        {
          id: 1007,
          tableNumber: 8,
          customerPhone: "9000000007",
          total: 1350,
          paymentMethod: "qr",
          timestamp: new Date(now.getTime() - 6 * 86400000),
          items: [],
          status: "confirmed",
        },
        // a previous month example to enable month-wise view
        {
          id: 1008,
          tableNumber: 4,
          customerPhone: "9000000008",
          total: 1550,
          paymentMethod: "cash",
          timestamp: new Date(now.getFullYear(), now.getMonth() - 1, 15, 19, 35),
          items: [],
          status: "confirmed",
        },
        {
          id: 1009,
          tableNumber: 10,
          customerPhone: "9000000009",
          total: 890,
          paymentMethod: "qr",
          timestamp: new Date(now.getFullYear(), now.getMonth() - 1, 18, 13, 10),
          items: [],
          status: "confirmed",
        },
      ]
      setConfirmedPayments(samples)
    }
  }, [confirmedPayments.length])

  const handleConfirmPayment = (paymentId: number) => {
    const payment = pendingPayments.find((p) => p.id === paymentId)
    if (payment) {
      // Move to confirmed payments
      const confirmedPayment = { ...payment, status: "confirmed" as const }
      setConfirmedPayments((prev) => [confirmedPayment, ...prev])

      // Remove from pending
      setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId))

      // Notify customer
      realTimeSync.emitPaymentConfirmation(paymentId, payment.customerPhone, payment.tableNumber)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("All Status")
    setPaymentMethodFilter("All Methods")
  }

  const [viewBy, setViewBy] = useState<"day" | "month">("day")
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const fmtDay = (d: Date) => new Date(d).toISOString().slice(0, 10) // YYYY-MM-DD
  const fmtMonth = (d: Date) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}` // YYYY-MM
  }

  const dayMap = confirmedPayments.reduce<Record<string, { revenue: number; count: number }>>((acc, p) => {
    const key = fmtDay(p.timestamp)
    acc[key] = acc[key] || { revenue: 0, count: 0 }
    acc[key].revenue += p.total
    acc[key].count += 1
    return acc
  }, {})
  const monthMap = confirmedPayments.reduce<Record<string, { revenue: number; count: number }>>((acc, p) => {
    const key = fmtMonth(p.timestamp)
    acc[key] = acc[key] || { revenue: 0, count: 0 }
    acc[key].revenue += p.total
    acc[key].count += 1
    return acc
  }, {})

  const dayRevenueData = Object.entries(dayMap)
    .map(([day, v]) => ({ day, revenue: v.revenue, count: v.count }))
    .sort((a, b) => a.day.localeCompare(b.day))
  const monthRevenueData = Object.entries(monthMap)
    .map(([month, v]) => ({ month, revenue: v.revenue, count: v.count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  useEffect(() => {
    if (!selectedDay && dayRevenueData.length > 0) {
      setSelectedDay(dayRevenueData[dayRevenueData.length - 1].day)
    }
    if (!selectedMonth && monthRevenueData.length > 0) {
      setSelectedMonth(monthRevenueData[monthRevenueData.length - 1].month)
    }
  }, [selectedDay, selectedMonth, dayRevenueData, monthRevenueData])

  const paymentsForSelectedDay = selectedDay ? confirmedPayments.filter((p) => fmtDay(p.timestamp) === selectedDay) : []
  const paymentsForSelectedMonth = selectedMonth
    ? confirmedPayments.filter((p) => fmtMonth(p.timestamp) === selectedMonth)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
        <p className="text-muted-foreground">Confirm cash payments and monitor all transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold text-orange-600">{pendingPayments.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Payments</p>
                <p className="text-3xl font-bold text-blue-600">{todaysPayments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{todaysRevenue}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash vs QR</p>
                <p className="text-3xl font-bold text-purple-600">
                  {cashPayments} / {qrPayments}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <div className="flex gap-1">
                  <Banknote className="w-3 h-3 text-purple-600" />
                  <CreditCard className="w-3 h-3 text-purple-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter Payments</span>
            </div>

            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Phone, Table, or Payment ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Methods">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({pendingPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">No Payments Found</h3>
              <p className="text-muted-foreground">
                All payments have been processed or no payments match your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-orange-600">T{payment.tableNumber}</span>
                    </div>
                    <div>
                      <div className="font-medium">Table {payment.tableNumber}</div>
                      <div className="text-sm text-muted-foreground">{payment.customerPhone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">₹{payment.total}</div>
                      <div className="text-sm text-muted-foreground">Cash Payment</div>
                    </div>
                    <Badge variant="destructive">Pending</Badge>
                    <Button onClick={() => handleConfirmPayment(payment.id)}>Confirm Payment</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue History */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">View aggregated revenue and drill into details</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewBy} onValueChange={(v: any) => setViewBy(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="View by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day-wise</SelectItem>
                  <SelectItem value="month">Month-wise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewBy === "day" ? (
                <BarChart data={dayRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#fc8019" />
                </BarChart>
              ) : (
                <BarChart data={monthRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#60b246" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Aggregates + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: aggregated list */}
            <div className="space-y-3">
              <h4 className="font-semibold">{viewBy === "day" ? "Daily revenue" : "Monthly revenue"}</h4>
              <div className="max-h-[360px] overflow-auto rounded-lg border">
                <div className="divide-y">
                  {(viewBy === "day" ? dayRevenueData : monthRevenueData).map((row) => {
                    const key = viewBy === "day" ? (row as any).day : (row as any).month
                    const isActive = viewBy === "day" ? selectedDay === key : selectedMonth === key
                    return (
                      <button
                        key={key}
                        onClick={() => (viewBy === "day" ? setSelectedDay(key) : setSelectedMonth(key))}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted ${
                          isActive ? "bg-muted" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">{key}</div>
                          <div className="text-xs text-muted-foreground">{(row as any).count} payments</div>
                        </div>
                        <div className="font-semibold text-primary">₹{(row as any).revenue}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: detail table */}
            <div className="space-y-3 min-w-0">
              <h4 className="font-semibold">
                Details{" "}
                {viewBy === "day"
                  ? selectedDay
                    ? `for ${selectedDay}`
                    : ""
                  : selectedMonth
                    ? `for ${selectedMonth}`
                    : ""}
              </h4>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viewBy === "day" ? paymentsForSelectedDay : paymentsForSelectedMonth).map((p) => {
                      const d = new Date(p.timestamp)
                      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{time}</TableCell>
                          <TableCell>#{p.id}</TableCell>
                          <TableCell>T{p.tableNumber}</TableCell>
                          <TableCell className="capitalize">{p.paymentMethod}</TableCell>
                          <TableCell className="text-right">₹{p.total}</TableCell>
                        </TableRow>
                      )
                    })}
                    {(viewBy === "day" ? paymentsForSelectedDay : paymentsForSelectedMonth).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No payments found for the selected period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
