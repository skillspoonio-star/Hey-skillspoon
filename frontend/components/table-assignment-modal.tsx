"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface TableInfo {
  number: number
  capacity?: number
}

interface TableAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (tableNumber: number, customerName: string, mobileNumber: string) => void
  // parent may pass a preselected table object (or null)
  selectedTable?: TableInfo | null
}

export function TableAssignmentModal({ isOpen, onClose, onAssign, selectedTable }: TableAssignmentModalProps) {
  const [customerName, setCustomerName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([])
  const [chosenTable, setChosenTable] = useState<string>(selectedTable ? String(selectedTable.number) : "")

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

  useEffect(() => {
    // when modal opens and no preselected table, fetch available tables
    if (isOpen && !selectedTable) {
      let mounted = true
      ;(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/tables`)
          if (!res.ok) return
          const data = await res.json()
          const avail = (Array.isArray(data) ? data : []).filter((t: any) => (t.status || 'available') === 'available').map((t: any) => ({ number: Number(t.number), capacity: Number(t.capacity || 4) }))
          if (mounted) setAvailableTables(avail)
        } catch (e) {
          // ignore fetch errors here; parent page will show overall errors
        }
      })()
      return () => { mounted = false }
    }
    // if a selectedTable prop is provided, prefill chosenTable
    if (selectedTable) setChosenTable(String(selectedTable.number))
  }, [isOpen, selectedTable, API_BASE])

  const handleSubmit = () => {
    const tableNum = selectedTable ? selectedTable.number : (chosenTable ? Number.parseInt(chosenTable) : NaN)
    if (!Number.isFinite(tableNum) || !customerName || !mobileNumber) return
    onAssign(tableNum, customerName, mobileNumber)

    // Reset form
    setChosenTable("")
    setCustomerName("")
    setMobileNumber("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Assign Customer to Table</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name" className="text-sm font-medium">
              Customer Name
            </Label>
            <Input
              id="customer-name"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile-number" className="text-sm font-medium">
              Mobile Number
            </Label>
            <Input
              id="mobile-number"
              type="tel"
              placeholder="Enter mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
            disabled={!selectedTable || !customerName || !mobileNumber}
          >
            Assign Table & Generate QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
