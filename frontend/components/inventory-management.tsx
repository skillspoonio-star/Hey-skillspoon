"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Package, AlertTriangle, XCircle, TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react"
import { InlineLoader } from "@/components/ui/loader"

type InvItem = {
  id: number
  name: string
  category: string
  quantity: number
  lowStock: number
}

type StockStatus = "critical" | "low" | "good" | "excellent"

export function InventoryManagement() {
  const [items, setItems] = useState<InvItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAndInitialize() {
      try {
        setLoading(true)
        
        // Check localStorage first
        const saved = localStorage.getItem("inventory:items")
        if (saved) {
          const parsedItems = JSON.parse(saved)
          if (parsedItems.length > 0) {
            setItems(parsedItems)
            setLoading(false)
            return
          }
        }

        // Fetch from API if no localStorage data
        const base = process.env.NEXT_PUBLIC_BACKEND_URL
        const res = await fetch(`${base}/api/menu/items`)
        if (!res.ok) throw new Error("Failed to fetch menu items")
        const data = await res.json()
        
        // Initialize with default quantities
        const initializedItems = data.map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          quantity: Math.floor(Math.random() * 30) + 10, // Random between 10-40
          lowStock: 5,
        }))
        
        setItems(initializedItems)
        localStorage.setItem("inventory:items", JSON.stringify(initializedItems))
      } catch (error) {
        console.error("Error fetching menu items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndInitialize()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("inventory:items", JSON.stringify(items))
    }
  }, [items])

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()),
  )

  const adjust = (id: number, delta: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)))
  }

  const setQty = (id: number, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, qty) } : i)))
  }

  const setLow = (id: number, low: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, lowStock: Math.max(0, low) } : i)))
  }

  const getStockStatus = (quantity: number, lowStock: number): StockStatus => {
    const ratio = quantity / lowStock
    if (quantity === 0) return "critical"
    if (ratio <= 1) return "critical"
    if (ratio <= 2) return "low"
    if (ratio <= 4) return "good"
    return "excellent"
  }

  const getStockColor = (status: StockStatus) => {
    switch (status) {
      case "critical": return "text-red-600 dark:text-red-500"
      case "low": return "text-amber-600 dark:text-amber-500"
      case "good": return "text-blue-600 dark:text-blue-500"
      case "excellent": return "text-green-600 dark:text-green-500"
    }
  }

  const getStockBgColor = (status: StockStatus) => {
    switch (status) {
      case "critical": return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
      case "low": return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
      case "good": return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
      case "excellent": return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
    }
  }

  const getStockIcon = (status: StockStatus) => {
    switch (status) {
      case "critical": return <AlertTriangle className="w-4 h-4" />
      case "low": return <TrendingDown className="w-4 h-4" />
      case "good": return <TrendingUp className="w-4 h-4" />
      case "excellent": return <CheckCircle2 className="w-4 h-4" />
    }
  }

  const getStockLabel = (status: StockStatus) => {
    switch (status) {
      case "critical": return "Critical"
      case "low": return "Low Stock"
      case "good": return "Good"
      case "excellent": return "Excellent"
    }
  }

  const getStockPercentage = (quantity: number, lowStock: number) => {
    const maxStock = lowStock * 5 // Assume max is 5x low stock threshold
    return Math.min((quantity / maxStock) * 100, 100)
  }

  const criticalCount = items.filter((i) => getStockStatus(i.quantity, i.lowStock) === "critical").length
  const lowCount = items.filter((i) => getStockStatus(i.quantity, i.lowStock) === "low").length
  const totalSkus = items.length
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0)
  const categories = Array.from(new Set(items.map(i => i.category)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoader size="md" text="Loading inventory..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total SKUs</p>
                <p className="text-3xl font-bold">{totalSkus}</p>
                <p className="text-xs text-muted-foreground">{categories.length} categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Package className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Units</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500">{totalUnits}</p>
                <p className="text-xs text-muted-foreground">In stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{lowCount}</p>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Urgent restock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search items or category..." 
              className="pl-10 h-11"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-muted rounded-full">
                <XCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">No items found</h3>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try adjusting your search" : "No inventory items available"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const status = getStockStatus(item.quantity, item.lowStock)
            const percentage = getStockPercentage(item.quantity, item.lowStock)
            
            return (
              <Card 
                key={item.id} 
                className="hover:shadow-lg transition-all duration-200 border-l-4"
                style={{
                  borderLeftColor: status === "critical" ? "rgb(220 38 38)" :
                                   status === "low" ? "rgb(245 158 11)" :
                                   status === "good" ? "rgb(59 130 246)" :
                                   "rgb(34 197 94)"
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold truncate">{item.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStockColor(status)} border-current`}
                        >
                          <span className="flex items-center gap-1">
                            {getStockIcon(status)}
                            {getStockLabel(status)}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stock Level Indicator */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className={`font-bold ${getStockColor(status)}`}>
                        {item.quantity} units
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          status === "critical" ? "bg-red-500" :
                          status === "low" ? "bg-amber-500" :
                          status === "good" ? "bg-blue-500" :
                          "bg-green-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Threshold: {item.lowStock} units
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Adjust Quantity</label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20"
                        onClick={() => adjust(item.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        className="flex-1 h-10 text-center font-bold text-lg"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setQty(item.id, Number.parseInt(e.target.value || "0"))}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/20"
                        onClick={() => adjust(item.id, +1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Low Stock Threshold */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Low Stock Alert</label>
                    <Input
                      className="h-10 text-center"
                      type="number"
                      value={item.lowStock}
                      onChange={(e) => setLow(item.id, Number.parseInt(e.target.value || "0"))}
                      placeholder="Set threshold"
                    />
                  </div>

                  {/* Alert Messages */}
                  {status === "critical" && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${getStockBgColor(status)}`}>
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                          Critical Stock Level
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-500 mt-0.5">
                          Immediate restocking required
                        </p>
                      </div>
                    </div>
                  )}
                  {status === "low" && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${getStockBgColor(status)}`}>
                      <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                          Low Stock Warning
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                          Consider restocking soon
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
