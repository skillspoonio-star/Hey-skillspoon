"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Phone, CheckCircle, ChefHat, Utensils, AlertTriangle, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Order } from "@/hooks/use-order-manager"

interface OrderCardProps {
  order: Order
  onStatusUpdate: (orderId: string | number, newStatus: Order["status"]) => void
  onCallWaiter?: (orderId: string | number, tableNumber: number) => void
}

export function OrderCard({ order, onStatusUpdate, onCallWaiter }: OrderCardProps) {
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "destructive"
      case "preparing":
        return "default"
      case "ready":
        return "secondary"
      case "served":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: Order["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
    switch (currentStatus) {
      case "pending":
        return "preparing"
      case "preparing":
        return "ready"
      case "ready":
        return "served"
      default:
        return null
    }
  }

  const getNextStatusLabel = (currentStatus: Order["status"]): string => {
    switch (currentStatus) {
      case "pending":
        return "Start Preparing"
      case "preparing":
        return "Mark Ready"
      case "ready":
        return "Mark Served"
      default:
        return ""
    }
  }

  const getNextStatusIcon = (currentStatus: Order["status"]) => {
    switch (currentStatus) {
      case "pending":
        return <ChefHat className="w-4 h-4" />
      case "preparing":
        return <CheckCircle className="w-4 h-4" />
      case "ready":
        return <Utensils className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    return `${diffInHours}h ${diffInMinutes % 60}m ago`
  }

  const nextStatus = getNextStatus(order.status)

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md min-w-[320px]",
        order.priority === "high" && "border-destructive/50 shadow-destructive/10",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {(order.orderType=='dine-in')?
            <h4 className="font-semibold text-base">Table {order.tableNumber}</h4>:
            (order.orderType=='delivery')?
            <h4 className="font-semibold text-base">#DLV{order.tableNumber}</h4>
            :
            <h4 className="font-semibold text-base">#TK{order.tableNumber}</h4>
            }
            <Badge variant={getStatusColor(order.status)} className="capitalize text-xs">
              {order.status}
            </Badge>
            {order.priority && (
              <Badge variant={getPriorityColor(order.priority)} className="text-xs">
                {order.priority === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                {order.priority}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span className="whitespace-nowrap">{formatTime(order.timestamp)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {order.customerName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-wrap mt-2">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{order.customerName}</span>
            {order.orderType && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {order.orderType}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start gap-2 text-sm">
              <span className="flex-1 min-w-0">
                <span className="font-medium">{item.quantity}x</span> <span className="break-words">{item.name}</span>
                {item.specialInstructions && (
                  <span className="text-xs text-muted-foreground block mt-1 break-words">Note: {item.specialInstructions}</span>
                )}
              </span>
              <span className="font-medium flex-shrink-0">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Total and Payment Status */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center font-semibold">
            <span>Total</span>
            <div className="flex items-center gap-2">
              <span>₹{order.total}</span>
              {order.paymentStatus && (
                <Badge variant={order.paymentStatus === "paid" ? "secondary" : "destructive"}>
                  {order.paymentStatus}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Estimated Time
        {order.estimatedTime && order.status !== "served" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Est. {order.estimatedTime} minutes</span>
          </div>
        )} */}

        {/* Customer Phone */}
        {order.customerPhone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{order.customerPhone}</span>
          </div>
        )}

        {/* Action Button Container */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Call Waiter Button */}
          {onCallWaiter && order.status !== "served" && (
            <Button
              onClick={() => onCallWaiter(order.id, order.tableNumber)}
              variant="outline"
              size="sm"
              className="flex-1 w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              <span className="truncate">Call Waiter</span>
            </Button>
          )}

          {/* Action Button */}
          {nextStatus && (
            <Button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              className="flex-1 w-full"
              size="sm"
              variant={
                order.status === "pending" ? "destructive" : order.status === "preparing" ? "default" : "secondary"
              }
            >
              {getNextStatusIcon(order.status)}
              <span className="ml-2 truncate">{getNextStatusLabel(order.status)}</span>
            </Button>
          )}
        </div>

        {order.status === "served" && <div className="text-center text-sm text-muted-foreground">Order completed</div>}
      </CardContent>
    </Card>
  )
}
