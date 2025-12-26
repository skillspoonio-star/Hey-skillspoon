"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Minus,
  Clock,
  Star,
  Leaf,
  ArrowLeft
} from "lucide-react"
import { fetchMenuItems, type MenuItem } from "@/lib/menu-data"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"
import { ThemeToggle } from "@/components/theme-toggle"

type CartLine = { id: number; name: string; price: number; qty: number }

export default function DeliveryMenuPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
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

  const categories = useMemo(() => [
    { id: "all", name: "All Items", count: itemsLoaded.length },
    { id: "popular", name: "Popular", count: itemsLoaded.filter((item) => item.isPopular).length },
    { id: "starters", name: "Starters", count: itemsLoaded.filter((item) => item.category.toLowerCase().includes("starter")).length },
    { id: "main course", name: "Mains", count: itemsLoaded.filter((item) => item.category.toLowerCase().includes("main")).length },
    { id: "biryani", name: "Biryani", count: itemsLoaded.filter((item) => item.category.toLowerCase().includes("biryani")).length },
    { id: "breads", name: "Breads", count: itemsLoaded.filter((item) => item.category.toLowerCase().includes("bread")).length },
    { id: "beverages", name: "Beverages", count: itemsLoaded.filter((item) => item.category.toLowerCase().includes("beverage")).length },
    { id: "desserts", name: "Desserts", count: itemsLoaded.filter((item) => item.category.toLowerCase().includes("dessert")).length },
  ], [itemsLoaded])

  const filteredItems = useMemo(() => {
    return itemsLoaded.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Handle "all" category to show all items
      if (selectedCategory === "all") {
        return matchesSearch
      }

      const matchesCategory = selectedCategory === "popular"
        ? item.isPopular
        : item.category.toLowerCase().includes(selectedCategory.toLowerCase())

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, itemsLoaded])

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
      {/* Header - Exact match to restaurant-info design */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-sans font-bold text-xl text-foreground">Menu</h1>
                <p className="text-sm text-muted-foreground">Restaurant Menu</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Badge variant="secondary">Delivery Available</Badge>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-40">
        {/* Categories - Exact match to restaurant-info design */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs">
              All Items
            </TabsTrigger>
            <TabsTrigger value="popular" className="text-xs">
              Popular
            </TabsTrigger>
            <TabsTrigger value="starters" className="text-xs">
              Starters
            </TabsTrigger>
            <TabsTrigger value="main course" className="text-xs">
              Mains
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.slice(5).map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap text-xs"
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </Tabs>

        {/* Menu Items - Exact match to restaurant-info design with Add/Remove functionality */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <InlineLoader text="Loading menu items..." size="md" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No items found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => {
              const cartQty = cart.find((l) => l.id === item.id)?.qty || 0
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {item.isVeg && <Leaf className="w-4 h-4 text-green-600" />}
                            {item.isPopular && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">4.5</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-lg text-foreground mb-2">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.description}</p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-xl text-foreground">₹{item.price}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{item.preparationTime || "25 mins"}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            {cartQty === 0 ? (
                              <Button
                                variant="outline"
                                className="bg-transparent h-8 hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors"
                                onClick={() => add(item.id)}
                              >
                                Add
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors"
                                  onClick={() => sub(item.id)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="font-semibold text-sm w-8 text-center">{cartQty}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors"
                                  onClick={() => add(item.id)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-32 h-32 m-4 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image || "https://placehold.co/128x128/f97316/ffffff?text=Dish"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/128x128/f97316/ffffff?text=Dish"
                          }}
                        />
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
          <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-safe backdrop-blur-md border-t">
            <div className="mx-auto max-w-4xl px-4 pb-2">
              <Card className="border-2 border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 shadow-xl">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-4 text-white">
                      <div className="text-center">
                        <div className="text-xl font-bold">{cart.reduce((s, l) => s + l.qty, 0)}</div>
                        <div className="text-xs text-orange-100">Items</div>
                      </div>
                      <div className="h-8 w-px bg-white/30"></div>
                      <div className="text-center">
                        <div className="text-xl font-bold">₹{subtotal}</div>
                        <div className="text-xs text-orange-100">Subtotal</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push("/delivery/checkout")}
                      className="bg-white text-orange-600 hover:bg-orange-50 dark:bg-white dark:text-orange-600 dark:hover:bg-orange-50 font-bold text-sm px-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto h-10"
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