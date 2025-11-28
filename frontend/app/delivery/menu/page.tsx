"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Minus } from "lucide-react"
import { fetchMenuItems, type MenuItem } from "@/lib/menu-data"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"

type CartLine = { id: number; name: string; price: number; qty: number }

type MenuCartItem = MenuItem & { quantity?: number }

export default function DeliveryMenuPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [vegOnly, setVegOnly] = useState(false)
  const [category, setCategory] = useState<string>("all")
  const [itemsLoaded, setItemsLoaded] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        const items = await fetchMenuItems()
        if (!mounted) return
        setItemsLoaded(items)
      } catch (err) {
        console.error('Failed to load menu items', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("delivery:cart")
      if (saved) setCart(JSON.parse(saved))
    }

    return () => {
      mounted = false
    }
  }, [])

  const items = useMemo(
    () =>
      itemsLoaded.filter((m) => {
        const s = query.toLowerCase()
        const matchesSearch =
          m.name.toLowerCase().includes(s) ||
          m.description.toLowerCase().includes(s) ||
          m.category.toLowerCase().includes(s)
        const matchesVeg = vegOnly ? !!m.isVeg : true
        const matchesCategory = category === "all" ? true : m.category.toLowerCase() === category.toLowerCase()
        return matchesSearch && matchesVeg && matchesCategory
      }),
    [query, vegOnly, category],
  )

  const add = (id: number) => {
  const m = itemsLoaded.find((x) => x.id === id)!
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }
        return copy
      }
      return [...prev, { id, name: m.name, price: m.price, qty: 1 }]
    })
  }
  const sub = (id: number) => {
    setCart((prev) => prev.flatMap((l) => (l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])))
  }

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("delivery:cart", JSON.stringify(cart))
    }
  }, [cart])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto p-4 space-y-6 pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search dishes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full h-10 rounded border bg-background"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {Array.from(new Set(itemsLoaded.map((m: MenuItem) => m.category))).map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button
              variant={vegOnly ? "default" : "outline"}
              className="w-full h-10"
              onClick={() => setVegOnly((v) => !v)}
            >
              {vegOnly ? "Showing Veg Only" : "Veg Only"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <InlineLoader text="Loading menu items..." size="md" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-24 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                  <img src={i.image || "/placeholder.svg"} alt={i.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{i.name}</div>
                    <div className="font-bold">₹{i.price}</div>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{i.description}</div>
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-8 bg-transparent" onClick={() => sub(i.id)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <div className="w-8 text-center">{cart.find((l) => l.id === i.id)?.qty || 0}</div>
                    <Button size="sm" className="h-8" onClick={() => add(i.id)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fixed Bottom Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="mx-auto max-w-3xl px-4 pb-4">
              <div className="rounded-xl border bg-background shadow-lg p-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Items: {cart.reduce((s, l) => s + l.qty, 0)}</div>
                <div className="font-semibold">Subtotal: ₹{subtotal}</div>
                <Button onClick={() => router.push("/delivery/checkout")} aria-label="Proceed to checkout">
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
