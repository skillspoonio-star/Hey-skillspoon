"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Minus } from "lucide-react"
import { fetchMenuItems, type MenuItem } from "@/lib/menu-data"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"
import { BackButton } from "@/components/ui/back-button"

type CartLine = { id: number; name: string; price: number; qty: number }

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
      ; (async () => {
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
    [query, vegOnly, category, itemsLoaded],
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
      {/* Hero Header */}
      <div className="bg-card border-b py-8 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <BackButton className="mb-4" fallbackRoute="/" />
          <h1 className="text-4xl font-bold mb-2">🍽️ Our Menu</h1>
          <p className="text-muted-foreground">Delicious food delivered to your doorstep</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-32">
        {/* Filters Card */}
        <Card className="shadow-lg border-2">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-10 h-12 text-base"
                  placeholder="Search dishes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="w-full h-12 rounded-lg border bg-background px-4 text-base focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="all">🍽️ All categories</option>
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
                  className={`w-full h-12 text-base font-semibold ${vegOnly ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-muted'}`}
                  onClick={() => setVegOnly((v) => !v)}
                >
                  🥬 {vegOnly ? "Showing Veg Only" : "Veg Only"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <InlineLoader text="Loading delicious menu..." size="md" />
          </div>
        ) : items.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((i) => {
              const cartQty = cart.find((l) => l.id === i.id)?.qty || 0
              return (
                <Card key={i.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={i.image || "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image"}
                        alt={i.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image"
                        }}
                      />
                    </div>
                    {i.isVeg && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        🥬 VEG
                      </div>
                    )}
                    {cartQty > 0 && (
                      <div className="absolute top-3 right-3 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                        {cartQty}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">{i.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{i.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-2xl font-bold text-orange-600">₹{i.price}</div>
                        {cartQty === 0 ? (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md"
                            onClick={() => add(i.id)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-muted-foreground/20"
                              onClick={() => sub(i.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <div className="w-8 text-center font-bold">{cartQty}</div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-muted-foreground/20"
                              onClick={() => add(i.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Fixed Bottom Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background/80 to-transparent pt-2 pb-safe backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-4 pb-1">
              <Card className="border border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 shadow-lg">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-white">
                      <div className="text-center">
                        <div className="text-xl font-bold">{cart.reduce((s, l) => s + l.qty, 0)}</div>
                        <div className="text-[10px] text-orange-100">Items</div>
                      </div>
                      <div className="h-8 w-px bg-white/30"></div>
                      <div className="text-center">
                        <div className="text-xl font-bold">₹{subtotal}</div>
                        <div className="text-[10px] text-orange-100">Subtotal</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push("/delivery/checkout")}
                      className="bg-white text-orange-600 hover:bg-orange-50 dark:bg-white dark:text-orange-600 dark:hover:bg-orange-50 font-bold text-sm px-4 shadow-lg w-full sm:w-auto h-9"
                      aria-label="Proceed to checkout"
                    >
                      Checkout →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
