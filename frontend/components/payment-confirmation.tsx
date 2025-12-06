"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Search, DollarSign, AlertTriangle, Filter, Banknote, Wallet, TrendingUp } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CashPaymentRequest {
  _id: string
  tableNumber: number
  totalAmount: number
  timestamp: string
  unpaidOrderCount: number
}



interface Payment {
  _id: string
  amount: number
  type: "cash" | "card" | "upi" | "qr"
  paymentOf: "order" | "reservation" | "session"
  orderId: string | null
  reservationId: string | null
  sessionId: string | null
  createdAt: string
  updatedAt: string
}

export function PaymentConfirmation() {
  const [cashPaymentRequests, setCashPaymentRequests] = useState<CashPaymentRequest[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Helper functions for date formatting
  const fmtDay = (timestamp: string) => timestamp.slice(0, 10) // YYYY-MM-DD from ISO string
  const fmtMonth = (timestamp: string) => timestamp.slice(0, 7) // YYYY-MM from ISO string

  // Get today's date (midnight to midnight)
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().slice(0, 10) // YYYY-MM-DD
  }
  const todayDate = getTodayDate()

  // Calculate statistics from real payment data - only for today
  const todaysPayments = payments.filter((p) => fmtDay(p.createdAt) === todayDate).length
  const todaysRevenue = payments
    .filter((p) => fmtDay(p.createdAt) === todayDate)
    .reduce((sum, p) => sum + p.amount, 0)

  // Calculate today's cash payments only
  const todaysCashRevenue = payments
    .filter((p) => fmtDay(p.createdAt) === todayDate && p.type === 'cash')
    .reduce((sum, p) => sum + p.amount, 0)

  // Fetch cash payment requests from API
  const fetchCashPaymentRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${base}/api/payment-requests`)
      if (!response.ok) throw new Error("Failed to fetch payment requests")
      const data: CashPaymentRequest[] = await response.json()
      setCashPaymentRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching payment requests:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all payments from backend for revenue history
  const fetchPayments = async () => {
    try {
      const response = await fetch(`${base}/api/payments`)
      if (!response.ok) throw new Error("Failed to fetch payments")
      const data: Payment[] = await response.json()
      setPayments(data)
    } catch (err) {
      console.error("Error fetching payments:", err)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchCashPaymentRequests()
    fetchPayments()
  }, [])

  const handleConfirmPayment = async (requestId: string, tableNumber: number, totalAmount: number) => {
    const confirmPayment = window.confirm(`Are you sure you received payment of ₹${totalAmount} from table ${tableNumber}?`)
    if (!confirmPayment) return

    try {
      const response = await fetch(`${base}/api/payment-requests/${requestId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to confirm payment")
      }

      // Remove from pending requests
      setCashPaymentRequests((prev) => prev.filter((r) => r._id !== requestId))

      // Refresh payments to include the new payment in real-time
      fetchPayments()

      alert("Payment confirmed successfully!")
    } catch (err) {
      console.error("Error confirming payment:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to confirm payment"}`)
    }
  }

  const [viewBy, setViewBy] = useState<"day" | "month">("day")
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  // Calculate revenue data from real payment data
  const dayMap = payments.reduce<Record<string, { revenue: number; count: number }>>((acc, p) => {
    const key = fmtDay(p.createdAt)
    acc[key] = acc[key] || { revenue: 0, count: 0 }
    acc[key].revenue += p.amount
    acc[key].count += 1
    return acc
  }, {})
  const monthMap = payments.reduce<Record<string, { revenue: number; count: number }>>((acc, p) => {
    const key = fmtMonth(p.createdAt)
    acc[key] = acc[key] || { revenue: 0, count: 0 }
    acc[key].revenue += p.amount
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

  const paymentsForSelectedDay = selectedDay ? payments.filter((p) => fmtDay(p.createdAt) === selectedDay) : []
  const paymentsForSelectedMonth = selectedMonth
    ? payments.filter((p) => fmtMonth(p.createdAt) === selectedMonth)
    : []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
                <p className="text-3xl font-bold">{cashPaymentRequests.length}</p>
                <p className="text-xs text-muted-foreground">Cash payments</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Today's Payments</p>
                <p className="text-3xl font-bold">{todaysPayments}</p>
                <p className="text-xs text-muted-foreground">Completed today</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold">₹{todaysRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total collected</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Cash Collected</p>
                <p className="text-3xl font-bold">₹{todaysCashRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Cash only</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Search</span>
            </div>

            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by table number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button variant="outline" onClick={() => setSearchQuery("")} size="sm">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Payment Requests */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pending Cash Payment Requests</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {cashPaymentRequests.filter((r) => !searchQuery || r.tableNumber.toString().includes(searchQuery)).length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading payment requests...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">
              Error: {error}
            </div>
          )}
          {!loading && cashPaymentRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Pending Requests</h3>
              <p className="text-sm text-muted-foreground">All cash payment requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cashPaymentRequests
                .filter((r) => !searchQuery || r.tableNumber.toString().includes(searchQuery))
                .map((request) => (
                  <div key={request._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-orange-600 dark:text-orange-500">T{request.tableNumber}</span>
                      </div>
                      <div>
                        <div className="font-semibold">Table {request.tableNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.unpaidOrderCount} unpaid order{request.unpaidOrderCount !== 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-left sm:text-right flex-1 sm:flex-none">
                        <div className="font-bold text-lg">₹{request.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Cash Payment</div>
                      </div>
                      <Badge variant="destructive" className="hidden sm:inline-flex">Pending</Badge>
                      <Button 
                        onClick={() => handleConfirmPayment(request._id, request.tableNumber, request.totalAmount)}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                        size="sm"
                      >
                        Confirm Payment
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue History */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Revenue History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
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
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viewBy === "day" ? paymentsForSelectedDay : paymentsForSelectedMonth).map((p) => {
                      const d = new Date(p.createdAt)
                      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                      return (
                        <TableRow key={p._id}>
                          <TableCell>{time}</TableCell>
                          <TableCell>#{p._id}</TableCell>
                          <TableCell className="capitalize">{p.type}</TableCell>
                          <TableCell className="text-right">₹{p.amount}</TableCell>
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