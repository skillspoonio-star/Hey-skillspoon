"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface TableAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (tableNumber: number, customerName: string, partySize: number) => void
  availableTables: Array<{ number: number; capacity: number }>
}

export function TableAssignmentModal({ isOpen, onClose, onAssign, availableTables }: TableAssignmentModalProps) {
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [partySize, setPartySize] = useState("")

  const handleSubmit = () => {
    if (selectedTable && customerName && partySize) {
      const tableNumber = Number.parseInt(selectedTable.split(" ")[1])
      onAssign(tableNumber, customerName, Number.parseInt(partySize))

      const tableUrl = `${window.location.origin}/table/${tableNumber}`
      console.log(`[v0] Generated table URL: ${tableUrl}`)

      // In a real implementation, you would generate a QR code here
      // and possibly send it to a printer or display it to staff

      // Reset form
      setSelectedTable("")
      setCustomerName("")
      setPartySize("")
      onClose()
    }
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
            <Label htmlFor="table-select" className="text-sm font-medium">
              Select Table
            </Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.number} value={`Table ${table.number}`}>
                    Table {table.number} (Capacity: {table.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="party-size" className="text-sm font-medium">
              Party Size
            </Label>
            <Input
              id="party-size"
              type="number"
              placeholder="Number of guests"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              min="1"
              max="20"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
            disabled={!selectedTable || !customerName || !partySize}
          >
            Assign Table & Generate QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
