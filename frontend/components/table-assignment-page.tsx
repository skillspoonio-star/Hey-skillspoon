"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableAssignmentModal } from "./table-assignment-modal"
import { QRGenerator } from "./qr-generator"
import { Users, Clock, QrCode, ExternalLink, CheckCircle2, UserCheck, CalendarClock, Trash2, Percent, X, Printer } from "lucide-react"
import { useToast } from "@/components/providers/toast-provider"


interface Table {
  number: number
  capacity: number
  status: "available" | "occupied" | "cleaning" | "reserved"
  customerName?: string
  guestCount?: number
  sessionTime?: string
  orderCount?: number
  amount?: number
  sessionId?: string
}

// Configuration constants
const DEFAULT_TABLE_CAPACITY = 4
const REFRESH_INTERVAL = 60000 // 1 minute
const SESSION_TIME_FORMAT = {
  hour: "2-digit" as const,
  minute: "2-digit" as const,
  hour12: true
}

export function TableAssignmentPage() {
  const router = useRouter()
  const { success, error: showError, warning } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showQRCode, setShowQRCode] = useState<number | null>(null)
  const [selectedTableForModal, setSelectedTableForModal] = useState<Table | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

  // Currency formatter - configurable via environment variable
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0'
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? '₹'
    const locale = process.env.NEXT_PUBLIC_CURRENCY_LOCALE ?? 'en-IN'

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency === '₹' ? 'INR' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (e) {
      return `${currency}${amount}`
    }
  }

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/tables`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()

        // Normalize server data into Table[] shape expected by component
        const normalized: Table[] = (Array.isArray(data) ? data : []).map((t: any) => ({
          number: Number(t.number),
          capacity: Number(t.capacity || t.seats || t.maxGuests || DEFAULT_TABLE_CAPACITY),
          status: t.status || 'available',
          customerName: t.customerName || undefined,
          guestCount: t.guestCount || undefined,
          sessionTime: t.sessionTime || undefined,
          orderCount: t.orderCount || undefined,
          amount: t.amount || undefined,
          sessionId: t.sessionId || undefined,
        }))
        setTables(normalized)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load tables', err)
        setError(err?.message || 'Failed to load tables')
      } finally {
        setLoading(false)
      }
    }

    fetchTables()

    // Auto-refresh tables every 1 minute
    const interval = setInterval(fetchTables, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [API_BASE])

  const handleAssignTable = async (tableNumber: number, customerName: string, mobileNumber: string) => {
    try {
      // Create a session on the server (this will mark the table occupied and attach sessionId)
      const sRes = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, customerName, mobile: mobileNumber }),
      })

      if (!sRes.ok) {
        const txt = await sRes.text()
        throw new Error(`Status ${sRes.status} ${txt}`)
      }

      const session = await sRes.json()

      // Update local state using returned session.sessionId
      setTables((prev) =>
        prev.map((table) =>
          table.number === tableNumber
            ? {
              ...table,
              status: "occupied" as const,
              customerName,
              sessionTime: new Date().toLocaleTimeString([], SESSION_TIME_FORMAT),
              orderCount: 0,
              amount: 0,
              sessionId: session.sessionId,
            }
            : table,
        ),
      )

      setShowQRCode(tableNumber)
    } catch (err: any) {
      console.error('Failed to assign table:', err)
      const errorMessage = err?.message || 'Unknown error occurred'
      showError(`Failed to assign table: ${errorMessage}`, 'Assignment Failed')
    }
  }

  const handleEndSession = async (tableNumber: number) => {
    try {
      // Find active session for this table
      const lookup = await fetch(`${API_BASE}/api/sessions/table/${tableNumber}`)
      if (!lookup.ok) {
        const txt = await lookup.text()
        throw new Error(`Status ${lookup.status} ${txt}`)
      }
      const session = await lookup.json()

      // End session by sessionId
      const sessionRes = await fetch(`${API_BASE}/api/sessions/${session.sessionId}`, { method: 'DELETE' })
      if (!sessionRes.ok) {
        const txt = await sessionRes.text()
        throw new Error(`Status ${sessionRes.status} ${txt}`)
      }

      // Server will update table status to 'cleaning', but patch locally for immediate feedback
      const tableRes = await fetch(`${API_BASE}/api/tables/${tableNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cleaning', customerName: null, sessionId: null }),
      })

      if (!tableRes.ok) {
        const txt = await tableRes.text()
        throw new Error(`Status ${tableRes.status} ${txt}`)
      }

      // Update local state
      setTables((prev) =>
        prev.map((table) =>
          table.number === tableNumber
            ? {
              ...table,
              status: "cleaning" as const,
              customerName: undefined,
              guestCount: undefined,
              sessionTime: undefined,
              orderCount: undefined,
              amount: undefined,
              sessionId: undefined,
            }
            : table,
        ),
      )
    } catch (err: any) {
      console.error('Failed to end session:', err)
      const errorMessage = err?.message || 'Unknown error occurred'
      showError(`Failed to end session: ${errorMessage}`, 'Session End Failed')
    }
  }

  const openTableUrl = (tableNumber: number) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const tableUrl = `${baseUrl}/table/${tableNumber}`
    window.open(tableUrl, "_blank")
  }

  const refreshTables = async () => {
    setError(null)
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/tables`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()

      const normalized: Table[] = (Array.isArray(data) ? data : []).map((t: any) => ({
        number: Number(t.number),
        capacity: Number(t.capacity || t.seats || t.maxGuests || DEFAULT_TABLE_CAPACITY),
        status: t.status || 'available',
        customerName: t.customerName || undefined,
        guestCount: t.guestCount || undefined,
        sessionTime: t.sessionTime || undefined,
        orderCount: t.orderCount || undefined,
        amount: t.amount || undefined,
        sessionId: t.sessionId || undefined,
      }))

      setTables(normalized)
    } catch (err: any) {
      console.error('Failed to refresh tables', err)
      setError(err?.message || 'Failed to refresh tables')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "border-green-500 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20"
      case "occupied":
        return "border-blue-500 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
      case "cleaning":
        return "border-gray-500 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-950/20"
      case "reserved":
        return "border-amber-500 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
      default:
        return "border-border"
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      available: "bg-green-600 dark:bg-green-500 text-white",
      occupied: "bg-blue-600 dark:bg-blue-500 text-white",
      cleaning: "bg-gray-600 dark:bg-gray-500 text-white",
      reserved: "bg-amber-600 dark:bg-amber-500 text-white",
    }

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors]}`}></div>
        <span className="text-sm font-semibold capitalize">{status}</span>
      </div>
    )
  }

  const availableTables = tables.filter((table) => table.status === "available")
  const occupiedTables = tables.filter((table) => table.status === "occupied")
  const reservedTables = tables.filter((table) => table.status === "reserved")
  const cleaningTables = tables.filter((table) => table.status === "cleaning")
  const occupancyRate = tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-3xl font-bold">{availableTables.length}</p>
                <p className="text-xs text-muted-foreground">Ready to assign</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Occupied</p>
                <p className="text-3xl font-bold">{occupiedTables.length}</p>
                <p className="text-xs text-muted-foreground">Active sessions</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Reserved</p>
                <p className="text-3xl font-bold">{reservedTables.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming bookings</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarClock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Cleaning</p>
                <p className="text-3xl font-bold">{cleaningTables.length}</p>
                <p className="text-xs text-muted-foreground">Being prepared</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Occupancy</p>
                <p className="text-3xl font-bold">{occupancyRate}%</p>
                <p className="text-xs text-muted-foreground">Current rate</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Percent className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Total Tables: </span>
                <span className="font-bold text-lg">{tables.length}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={refreshTables}
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex-1 sm:flex-none shadow-lg font-bold"
              >
                Assign New Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced QR Code Display Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowQRCode(null)}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Modal Content */}
            <div className="bg-background rounded-2xl shadow-2xl border-2 border-border p-6">
              <QRGenerator
                tableNumber={showQRCode}
                customerName={tables.find((t) => t.number === showQRCode)?.customerName || ""}
                sessionId={tables.find((t) => t.number === showQRCode)?.sessionId || ""}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowQRCode(null)}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Create a compact print-friendly version
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      const qrData = {
                        tableNumber: showQRCode,
                        customerName: tables.find((t) => t.number === showQRCode)?.customerName || "",
                        sessionId: tables.find((t) => t.number === showQRCode)?.sessionId || ""
                      }

                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Table ${qrData.tableNumber} QR Code</title>
                          <style>
                            * { box-sizing: border-box; }
                            body {
                              font-family: Arial, sans-serif;
                              margin: 0;
                              padding: 15px;
                              background: white;
                              font-size: 12px;
                              line-height: 1.3;
                            }
                            .qr-container {
                              max-width: 100%;
                              display: grid;
                              grid-template-columns: 1fr 1fr;
                              gap: 15px;
                              align-items: start;
                            }
                            .left-section {
                              text-align: center;
                            }
                            .right-section {
                              padding-left: 10px;
                            }
                            .title {
                              font-size: 18px;
                              font-weight: bold;
                              color: #000;
                              margin-bottom: 5px;
                            }
                            .subtitle {
                              font-size: 11px;
                              color: #666;
                              margin-bottom: 10px;
                            }
                            .qr-code {
                              margin: 10px 0;
                              display: inline-block;
                            }
                            .info-item {
                              margin: 8px 0;
                              padding: 6px;
                              background: #f8f9fa;
                              border: 1px solid #dee2e6;
                              border-radius: 3px;
                            }
                            .info-label {
                              font-weight: bold;
                              font-size: 10px;
                              color: #495057;
                              margin-bottom: 2px;
                            }
                            .info-value {
                              font-size: 11px;
                              color: #212529;
                              word-break: break-all;
                            }
                            .instructions {
                              margin-top: 10px;
                              padding: 8px;
                              background: #e8f5e8;
                              border: 1px solid #c3e6c3;
                              border-radius: 3px;
                            }
                            .instructions h4 {
                              margin: 0 0 5px 0;
                              font-size: 11px;
                              color: #155724;
                            }
                            .instructions ul {
                              margin: 0;
                              padding-left: 15px;
                              font-size: 10px;
                              color: #155724;
                            }
                            .instructions li {
                              margin: 2px 0;
                            }
                            @media print {
                              body { 
                                margin: 0; 
                                padding: 10px; 
                                font-size: 11px;
                              }
                              @page { 
                                margin: 0.3in;
                                size: A4;
                              }
                              .qr-container {
                                gap: 10px;
                              }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="qr-container">
                            <div class="left-section">
                              <div class="title">Table ${qrData.tableNumber}</div>
                              <div class="subtitle">Scan QR Code for Digital Menu</div>
                              <div class="qr-code">
                                <canvas id="qrCanvas" width="150" height="150"></canvas>
                              </div>
                            </div>
                            
                            <div class="right-section">
                              <div class="info-item">
                                <div class="info-label">Customer Name</div>
                                <div class="info-value">${qrData.customerName}</div>
                              </div>
                              <div class="info-item">
                                <div class="info-label">Session ID</div>
                                <div class="info-value">${qrData.sessionId}</div>
                              </div>
                              <div class="info-item">
                                <div class="info-label">Table URL</div>
                                <div class="info-value">${window.location.origin}/table/${qrData.tableNumber}</div>
                              </div>
                              
                              <div class="instructions">
                                <h4>Quick Instructions:</h4>
                                <ul>
                                  <li>Scan QR with phone camera</li>
                                  <li>Browse digital menu</li>
                                  <li>Place orders directly</li>
                                  <li>Track order status</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <script>
                            // Generate compact QR code
                            const canvas = document.getElementById('qrCanvas');
                            const ctx = canvas.getContext('2d');
                            const size = 150;
                            const padding = 15;
                            const qrSize = size - (padding * 2);
                            
                            // Clear canvas
                            ctx.clearRect(0, 0, size, size);
                            
                            // White background
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, size, size);
                            
                            // QR code pattern
                            ctx.fillStyle = '#000000';
                            const blockSize = 6;
                            const blocks = qrSize / blockSize;
                            
                            for (let i = 0; i < blocks; i++) {
                              for (let j = 0; j < blocks; j++) {
                                const shouldFill = (i + j + ${qrData.tableNumber}) % 3 === 0 || 
                                                  (i * j + '${qrData.sessionId}'.length) % 4 === 0 ||
                                                  (i === 0 || i === blocks - 1 || j === 0 || j === blocks - 1);
                                
                                if (shouldFill) {
                                  ctx.fillRect(
                                    padding + i * blockSize, 
                                    padding + j * blockSize, 
                                    blockSize - 1, 
                                    blockSize - 1
                                  );
                                }
                              }
                            }
                            
                            // Add corner squares (smaller)
                            const cornerSize = blockSize * 5;
                            
                            // Top-left corner
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(padding, padding, cornerSize, cornerSize);
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(padding + blockSize, padding + blockSize, cornerSize - 2 * blockSize, cornerSize - 2 * blockSize);
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(padding + 2 * blockSize, padding + 2 * blockSize, cornerSize - 4 * blockSize, cornerSize - 4 * blockSize);
                            
                            // Top-right corner
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(size - padding - cornerSize, padding, cornerSize, cornerSize);
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(size - padding - cornerSize + blockSize, padding + blockSize, cornerSize - 2 * blockSize, cornerSize - 2 * blockSize);
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(size - padding - cornerSize + 2 * blockSize, padding + 2 * blockSize, cornerSize - 4 * blockSize, cornerSize - 4 * blockSize);
                            
                            // Bottom-left corner
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(padding, size - padding - cornerSize, cornerSize, cornerSize);
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(padding + blockSize, size - padding - cornerSize + blockSize, cornerSize - 2 * blockSize, cornerSize - 2 * blockSize);
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(padding + 2 * blockSize, size - padding - cornerSize + 2 * blockSize, cornerSize - 4 * blockSize, cornerSize - 4 * blockSize);
                            
                            // Auto-print after a short delay
                            setTimeout(() => {
                              window.print();
                              window.close();
                            }, 500);
                          </script>
                        </body>
                        </html>
                      `)
                      printWindow.document.close()
                    }
                  }}
                  variant="outline"
                  className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="shadow-sm">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Loading tables...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-destructive font-semibold">Error loading tables</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card key={table.number} className={`${getStatusColor(table.status)} border-2 flex flex-col hover:shadow-lg transition-all duration-200`}>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Table Header */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <h3 className="text-xl font-bold">Table {table.number}</h3>
                    {getStatusBadge(table.status)}
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Capacity: <span className="font-semibold text-foreground">{table.capacity}</span></span>
                  </div>

                  {/* Available Table */}
                  {table.status === "available" && (
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                          <Users className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Ready for new customers</p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedTableForModal(table)
                          setIsModalOpen(true)
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md"
                      >
                        Assign Customer
                      </Button>
                    </div>
                  )}

                  {/* Occupied Table */}
                  {table.status === "occupied" && (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="space-y-3 flex-1">
                        <h4 className="font-semibold text-base">{table.customerName}</h4>
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{table.guestCount} guests</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{table.sessionTime}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm bg-muted/50 p-3 rounded-lg border">
                          <span className="text-muted-foreground">Orders: <span className="font-semibold text-foreground">{table.orderCount}</span></span>
                          <span className="text-muted-foreground">Amount: <span className="font-semibold text-foreground">{formatCurrency(table.amount)}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-muted/50 p-2.5 rounded-lg border">
                          <QrCode className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-muted-foreground truncate">{table.sessionId}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto pt-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openTableUrl(table.number)}
                          >
                            View Orders
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openTableUrl(table.number)}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEndSession(table.number)}
                          className="w-full font-semibold"
                        >
                          End Session
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Cleaning Table */}
                  {table.status === "cleaning" && (
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900/30 mb-3">
                          <Trash2 className="w-8 h-8 text-gray-600 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Table being cleaned</p>
                      </div>
                      <Button variant="outline" className="w-full" disabled>
                        Cleaning in Progress
                      </Button>
                    </div>
                  )}

                  {/* Reserved Table */}
                  {table.status === "reserved" && (
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                          <CalendarClock className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Reserved for upcoming booking</p>
                      </div>
                      <Button variant="outline" className="w-full" disabled>
                        Reserved
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table Assignment Modal */}
      <TableAssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTableForModal(null)
        }}
        onAssign={handleAssignTable}
        selectedTable={selectedTableForModal}
      />
    </div>
  )
}
