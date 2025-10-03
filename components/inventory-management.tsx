"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Package, AlertTriangle } from "lucide-react"
import { menuItems as masterMenu } from "@/lib/menu-data"

type InvItem = {
  id: number
  name: string
  category: string
  quantity: number
  lowStock: number
}

export function InventoryManagement() {
  const base = useMemo(
    () =>
      masterMenu.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        quantity: 20,
        lowStock: 5,
      })),
    [],
  )
  const [items, setItems] = useState<InvItem[]>(base)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("inventory:items")
      if (saved) setItems(JSON.parse(saved))
    }
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

  const lowCount = items.filter((i) => i.quantity <= i.lowStock).length
  const totalSkus = items.length
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total SKUs</div>
              <div className="text-2xl font-bold">{totalSkus}</div>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Units</div>
              <div className="text-2xl font-bold text-chart-2">{totalUnits}</div>
            </div>
            <Package className="w-8 h-8 text-chart-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
              <div className="text-2xl font-bold text-destructive">{lowCount}</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items or category..." />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const low = item.quantity <= item.lowStock
          return (
            <Card key={item.id} className={low ? "border-amber-300 bg-amber-50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Quantity</div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => adjust(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      className="w-20 h-8"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => setQty(item.id, Number.parseInt(e.target.value || "0"))}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => adjust(item.id, +1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Low stock threshold</div>
                  <Input
                    className="w-24 h-8"
                    type="number"
                    value={item.lowStock}
                    onChange={(e) => setLow(item.id, Number.parseInt(e.target.value || "0"))}
                  />
                </div>
                {low && <div className="text-xs text-amber-700">Low stock — consider restocking</div>}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
