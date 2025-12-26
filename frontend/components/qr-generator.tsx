"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, User, Clock, Link } from "lucide-react"

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

    // Enhanced QR code placeholder with better design
    const size = 200
    const padding = 20
    const qrSize = size - (padding * 2)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)

    // QR code pattern (simplified)
    ctx.fillStyle = "#000000"

    // Create a more realistic QR code pattern
    const blockSize = 8
    const blocks = qrSize / blockSize

    for (let i = 0; i < blocks; i++) {
      for (let j = 0; j < blocks; j++) {
        // Create a pseudo-random pattern based on position
        const shouldFill = (i + j + tableNumber) % 3 === 0 ||
          (i * j + sessionId.length) % 4 === 0 ||
          (i === 0 || i === blocks - 1 || j === 0 || j === blocks - 1)

        if (shouldFill) {
          ctx.fillRect(
            padding + i * blockSize,
            padding + j * blockSize,
            blockSize - 1,
            blockSize - 1
          )
        }
      }
    }

    // Add corner squares (typical QR code feature)
    const cornerSize = blockSize * 7

    // Top-left corner
    ctx.fillStyle = "#000000"
    ctx.fillRect(padding, padding, cornerSize, cornerSize)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(padding + blockSize, padding + blockSize, cornerSize - 2 * blockSize, cornerSize - 2 * blockSize)
    ctx.fillStyle = "#000000"
    ctx.fillRect(padding + 2 * blockSize, padding + 2 * blockSize, cornerSize - 4 * blockSize, cornerSize - 4 * blockSize)

    // Top-right corner
    ctx.fillStyle = "#000000"
    ctx.fillRect(size - padding - cornerSize, padding, cornerSize, cornerSize)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(size - padding - cornerSize + blockSize, padding + blockSize, cornerSize - 2 * blockSize, cornerSize - 2 * blockSize)
    ctx.fillStyle = "#000000"
    ctx.fillRect(size - padding - cornerSize + 2 * blockSize, padding + 2 * blockSize, cornerSize - 4 * blockSize, cornerSize - 4 * blockSize)

    // Bottom-left corner
    ctx.fillStyle = "#000000"
    ctx.fillRect(padding, size - padding - cornerSize, cornerSize, cornerSize)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(padding + blockSize, size - padding - cornerSize + blockSize, cornerSize - 2 * blockSize, cornerSize - 2 * blockSize)
    ctx.fillStyle = "#000000"
    ctx.fillRect(padding + 2 * blockSize, size - padding - cornerSize + 2 * blockSize, cornerSize - 4 * blockSize, cornerSize - 4 * blockSize)

  }, [tableNumber, sessionId])

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg mb-4">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Table {tableNumber} QR Code
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Scan to access your table's digital menu
        </p>
      </div>

      {/* QR Code Card */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/50 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/10 shadow-xl">
        <CardContent className="p-6">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-gray-100">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
              <User className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-sm text-muted-foreground">{customerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
              <Clock className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Session ID</p>
                <p className="text-sm text-muted-foreground font-mono">{sessionId}</p>
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Table URL</span>
            </div>
            <p className="text-xs text-muted-foreground break-all font-mono bg-background/50 p-2 rounded border">
              {tableUrl}
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">How to use:</h4>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• Scan QR code with your phone camera</li>
              <li>• Access digital menu instantly</li>
              <li>• Place orders directly from your table</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
