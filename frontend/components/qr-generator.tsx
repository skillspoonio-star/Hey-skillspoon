"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QRGeneratorProps {
  tableNumber: number
  customerName: string
  sessionId: string
}

export function QRGenerator({ tableNumber, customerName, sessionId }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tableUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/table/${tableNumber}`

  useEffect(() => {
    // In production, you would use a proper QR code library like 'qrcode'
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Simple QR code placeholder
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, 200, 200)

    ctx.fillStyle = "#ffffff"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`Table ${tableNumber}`, 100, 100)
    ctx.fillText(sessionId, 100, 120)
  }, [tableNumber, sessionId])

  return (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle className="text-center">Table {tableNumber} QR Code</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          {customerName} - Session: {sessionId}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <canvas ref={canvasRef} width={200} height={200} className="border border-gray-300" />
        <div className="text-xs text-center text-muted-foreground max-w-48 break-all">{tableUrl}</div>
      </CardContent>
    </Card>
  )
}
