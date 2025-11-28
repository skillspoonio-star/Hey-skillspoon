"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableAssignmentModal } from "./table-assignment-modal"
import { QRGenerator } from "./qr-generator"
import { Users, Clock, QrCode, ExternalLink } from "lucide-react"
import { sessionManager } from "@/lib/session-manager"

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

export function TableAssignmentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showQRCode, setShowQRCode] = useState<number | null>(null)
  const [selectedTableForModal, setSelectedTableForModal] = useState<Table | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

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
          capacity: Number(t.capacity || 4),
          status: t.status || 'available',
          customerName: t.customerName || undefined,
          guestCount: t.guestCount || undefined,
          sessionTime: t.sessionTime || undefined,
          orderCount: t.orderCount || undefined,
          amount: t.amount || undefined,
          sessionId: t.sessionId || undefined,
        }))
        console.log('Fetched tables with sessions:', normalized[8].sessionId)
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
                sessionTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      alert(`Failed to assign table: ${err.message}`)
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
      alert(`Failed to end session: ${err.message}`)
    }
  }

  const openTableUrl = (tableNumber: number) => {
    const tableUrl = `${window.location.origin}/table/${tableNumber}`
    window.open(tableUrl, "_blank")
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

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Available Tables: </span>
                <span className="font-bold text-lg text-green-600 dark:text-green-500">{availableTables.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total Tables: </span>
                <span className="font-bold text-lg">{tables.length}</span>
              </div>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white w-full sm:w-auto shadow-lg font-bold"
            >
              Assign New Table
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Display */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="border-2 max-w-md w-full shadow-2xl">
            <CardContent className="p-6">
              <QRGenerator
                tableNumber={showQRCode}
                customerName={tables.find((t) => t.number === showQRCode)?.customerName || ""}
                sessionId={tables.find((t) => t.number === showQRCode)?.sessionId || ""}
              />
              <Button onClick={() => setShowQRCode(null)} className="w-full mt-4" variant="outline">
                Close
              </Button>
            </CardContent>
          </Card>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
          {tables.map((table) => (
          <Card key={table.number} className={`${getStatusColor(table.status)} border-2 min-h-[400px] flex flex-col hover:shadow-lg transition-shadow min-w-[330px]`}>
            <CardContent className="p-6 lg:p-8 flex-1 flex flex-col">
              <div className="space-y-5 flex-1 flex flex-col">
                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">Table {table.number}</h3>
                  {getStatusBadge(table.status)}
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-medium text-base">Capacity: {table.capacity}</span>
                </div>

                {/* Available Table */}
                {table.status === "available" && (
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                        <Users className="w-8 h-8 text-green-600 dark:text-green-500" />
                      </div>
                      <p className="text-muted-foreground">Ready for new customers</p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedTableForModal(table)
                        setIsModalOpen(true)
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg"
                    >
                      Assign Customer
                    </Button>
                  </div>
                )}

                {/* Occupied Table */}
                {table.status === "occupied" && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <h4 className="font-medium text-lg">{table.customerName}</h4>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{table.guestCount} guests</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{table.sessionTime}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm bg-muted p-3 rounded-lg border">
                        <span>Orders: {table.orderCount}</span>
                        <span>Amount: ₹{table.amount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs bg-muted p-2.5 rounded border">
                        <QrCode className="w-4 h-4" />
                        <span className="font-mono">{table.sessionId}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
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
                        className="w-full font-bold"
                      >
                        End Session
                      </Button>
                    </div>
                  </div>
                )}

                {/* Cleaning Table */}
                {table.status === "cleaning" && (
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900/30 mb-3">
                        <svg className="w-8 h-8 text-gray-600 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground">Table being cleaned</p>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" disabled>
                      Cleaning in Progress
                    </Button>
                  </div>
                )}

                {/* Reserved Table */}
                {table.status === "reserved" && (
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                        <Clock className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                      </div>
                      <p className="text-muted-foreground">Reserved for upcoming booking</p>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" disabled>
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
