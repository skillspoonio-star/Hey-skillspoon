import { type NextRequest, NextResponse } from "next/server"

// Mock database - in real app, this would be a proper database
const orders: any[] = []

export async function GET() {
  return NextResponse.json({ orders })
}

export async function POST(request: NextRequest) {
  try {
    const order = await request.json()

    // Add timestamp and ID if not present
    const newOrder = {
      ...order,
      id: order.id || Date.now(),
      timestamp: order.timestamp || new Date().toISOString(),
      status: order.status || "pending",
    }

    orders.push(newOrder)

    // In real app, you would:
    // 1. Save to database
    // 2. Send notification to restaurant dashboard
    // 3. Send SMS to customer
    // 4. Update real-time dashboard via WebSocket/SSE

    

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: "Order received successfully",
    })
  } catch (error) {
    console.error("[API] Error processing order:", error)
    return NextResponse.json({ success: false, error: "Failed to process order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    const orderIndex = orders.findIndex((order) => order.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    orders[orderIndex].status = status
    orders[orderIndex].updatedAt = new Date().toISOString()

    // In real app, you would:
    // 1. Update database
    // 2. Send notification to customer
    // 3. Update real-time dashboard

    

    return NextResponse.json({
      success: true,
      order: orders[orderIndex],
      message: "Order status updated successfully",
    })
  } catch (error) {
    console.error("[API] Error updating order:", error)
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
  }
}
