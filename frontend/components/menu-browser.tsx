"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Star, Clock, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchMenuItems } from "@/lib/menu-data"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  image: string
  rating: number
  prepTime: string
  isSpicy: boolean
  isVeg: boolean
  isAvailable: boolean
  isPopular?: boolean
}

interface MenuBrowserProps {
  onAddToOrder: (item: any) => void
  tableNumber?: number
  serverAddOrder?: (items: { name: string; quantity: number; price: number }[]) => Promise<any | null>
  currentOrder?: any[]
  onChangeQuantity?: (item: any, delta: number) => void
}

const menuData: MenuItem[] = []

const categories = ["All", "Starters", "Main Course", "Breads", "Beverages", "Desserts"]

export function MenuBrowser({ onAddToOrder, serverAddOrder, currentOrder = [], onChangeQuantity }: MenuBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<MenuItem[]>(menuData)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const fetched = await fetchMenuItems()
        if (!mounted) return
        // map fetched items to local MenuItem shape
        const mapped: MenuItem[] = fetched.map((it: any) => ({
          id: Number(it.id),
          name: it.name || "",
          description: it.description || "",
          price: Number(it.price || 0),
          category: it.category || "",
          image: it.image || "",
          rating: Number(it.rating || 4),
          prepTime: it.preparationTime || it.prepTime || "15 min",
          isSpicy: Boolean(it.isSpicy),
          isVeg: Boolean(it.isVeg),
          isAvailable: typeof it.isAvailable === 'boolean' ? it.isAvailable : true,
          isPopular: Boolean(it.isPopular),
        }))
        setItems(mapped)
      } catch (e) {
        // fallback to local menuData
        if (mounted) setItems(menuData)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToOrder = async (item: MenuItem) => {
    if (!item.isAvailable) return
  const single = { itemId: item.id, name: item.name, quantity: 1, price: item.price }
    // If parent provided an inline quantity setter, use it so Menu shows updated qty without switching views
    if (onChangeQuantity) {
      onChangeQuantity(single, 1)
      return
    }

    // Always add to the client's current order first so users can compose multi-item orders
    // include itemId so server payloads later have ids
    onAddToOrder({ id: Date.now(), item: item.name, itemId: item.id, quantity: 1, price: item.price })
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Popular Items */}
      {selectedCategory === "All" && (
        <div>
          <h3 className="font-semibold mb-3 text-lg">Popular Items</h3>
              <div className="grid gap-4">
                {items
                  .filter((item) => item.isPopular)
                  .map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} currentOrder={currentOrder} onChangeQuantity={onChangeQuantity} />
                  ))}
              </div>
        </div>
      )}

      {/* Menu Items */}
      <div>
        {selectedCategory !== "All" && <h3 className="font-semibold mb-3 text-lg">{selectedCategory}</h3>}
        <div className="grid gap-4">
          {filteredItems
            .filter((item) => (selectedCategory === "All" ? !item.isPopular : true))
            .map((item) => (
              <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} currentOrder={currentOrder} onChangeQuantity={onChangeQuantity} />
            ))}
        </div>
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No items found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MenuItemCard({
  item,
  onAddToOrder,
  currentOrder = [],
  onChangeQuantity,
}: {
  item: MenuItem
  onAddToOrder: (item: MenuItem) => void
  currentOrder?: any[]
  onChangeQuantity?: (item: any, delta: number) => void
}) {
  const existing = currentOrder.find((o) => Number(o.itemId) === Number(item.id))
  const qty = existing ? Number(existing.quantity || 0) : 0

  return (
    <Card className={cn("overflow-hidden", !item.isAvailable && "opacity-60")}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Item Image */}
          <div className="w-24 h-24 flex-shrink-0">
            <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* Item Details */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-base leading-tight">{item.name}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              </div>
              {item.isPopular && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Popular
                </Badge>
              )}
            </div>

            {/* Item Meta */}
            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-yellow-500" />
                <span>{item.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{item.prepTime}</span>
              </div>
              {item.isSpicy && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500" />
                  <span>Spicy</span>
                </div>
              )}
              <Badge variant={item.isVeg ? "secondary" : "destructive"} className="text-xs px-1 py-0">
                {item.isVeg ? "VEG" : "NON-VEG"}
              </Badge>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">₹{item.price}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-transparent"
                  onClick={() => (window.location.href = `/menu/${item.id}/reviews`)}
                >
                  Reviews
                </Button>

                {onChangeQuantity && qty ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 pointer"
                      onClick={() => onChangeQuantity({ itemId: item.id, name: item.name, price: item.price }, -1)}
                      disabled={qty <= 0}
                    >
                      -
                    </Button>
                    <div className="min-w-[24px] text-center">{qty}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0"
                      onClick={() => onChangeQuantity({ itemId: item.id, name: item.name, price: item.price }, 1)}
                    >
                      +
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => onAddToOrder(item)} disabled={!item.isAvailable} className="h-8">
                    {item.isAvailable ? (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </>
                    ) : (
                      "Unavailable"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
