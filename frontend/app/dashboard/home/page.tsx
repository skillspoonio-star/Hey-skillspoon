"use client"

import { useMemo } from 'react'
import { SectionHeader } from '@/components/section-header'
import { OrderCard } from '@/components/order-card'
import { useOrderManager } from '@/hooks/use-order-manager'
import { InlineLoader } from '@/components/ui/loader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, CheckCircle, TrendingUp, DollarSign } from 'lucide-react'

export default function DashboardHome() {
  const { isLoading, updateOrderStatus, getOrdersByStatus, getAnalytics } = useOrderManager()
  
  // Memoize order lists to prevent unnecessary recalculations
  const pending = useMemo(() => getOrdersByStatus('pending'), [getOrdersByStatus])
  const preparing = useMemo(() => getOrdersByStatus('preparing'), [getOrdersByStatus])
  const ready = useMemo(() => getOrdersByStatus('ready'), [getOrdersByStatus])
  const analytics = useMemo(() => getAnalytics(), [getAnalytics])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Live Orders" subtitle="Monitor and manage real-time orders" />
        <InlineLoader text="Loading orders..." size="md" />
      </div>
    )
  }

  const totalOrders = pending.length + preparing.length + ready.length

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <SectionHeader title="Live Orders" subtitle="Monitor and manage real-time orders" />

      {/* Analytics Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pending.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{preparing.length}</p>
              </div>
              <ChefHat className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{ready.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{analytics.totalRevenue.toFixed(0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Pending Orders Column */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-foreground">Pending Orders</h3>
            <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
              {pending.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No pending orders</p>
                  <p className="text-xs text-muted-foreground mt-1">New orders will appear here</p>
                </CardContent>
              </Card>
            ) : (
              pending.map((order) => (
                <OrderCard 
                  key={String(order.id)} 
                  order={order} 
                  onStatusUpdate={updateOrderStatus} 
                />
              ))
            )}
          </div>
        </div>

        {/* Preparing Orders Column */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-foreground">Preparing Orders</h3>
            <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
              {preparing.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {preparing.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No orders in preparation</p>
                  <p className="text-xs text-muted-foreground mt-1">Orders being prepared will show here</p>
                </CardContent>
              </Card>
            ) : (
              preparing.map((order) => (
                <OrderCard 
                  key={String(order.id)} 
                  order={order} 
                  onStatusUpdate={updateOrderStatus} 
                />
              ))
            )}
          </div>
        </div>

        {/* Ready Orders Column */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-foreground">Ready Orders</h3>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              {ready.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {ready.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No orders ready</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed orders will appear here</p>
                </CardContent>
              </Card>
            ) : (
              ready.map((order) => (
                <OrderCard 
                  key={String(order.id)} 
                  order={order} 
                  onStatusUpdate={updateOrderStatus} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
