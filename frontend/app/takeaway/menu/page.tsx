"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Minus, ShoppingCart, Clock, Star, Leaf } from "lucide-react"
import { useRouter } from "next/navigation"


import { fetchMenuItems, type MenuItem } from '@/lib/menu-data'

type CartItem = MenuItem & { quantity?: number }

export default function TakeawayMenuPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("popular")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const items = await fetchMenuItems()
        if (!mounted) return
        setMenuItems(items)
      } catch (err) {
        console.error('Failed to load menu items', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const categories = [
    { id: "popular", name: "Popular", count: menuItems.filter((item) => item.isPopular).length },
    { id: "starters", name: "Starters", count: menuItems.filter((item) => item.category === "starters").length },
    { id: "mains", name: "Main Course", count: menuItems.filter((item) => item.category === "mains").length },
    { id: "biryani", name: "Biryani", count: menuItems.filter((item) => item.category === "biryani").length },
    { id: "breads", name: "Breads", count: menuItems.filter((item) => item.category === "breads").length },
    { id: "beverages", name: "Beverages", count: menuItems.filter((item) => item.category === "beverages").length },
    { id: "desserts", name: "Desserts", count: menuItems.filter((item) => item.category === "desserts").length },
  ]

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "popular" ? item.isPopular : item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 } : cartItem,
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      return prev
        .map((cartItem) => {
          if (cartItem.id === itemId) {
            const newQuantity = (cartItem.quantity || 1) - 1
            return newQuantity > 0 ? { ...cartItem, quantity: newQuantity } : null
          }
          return cartItem
        })
        .filter(Boolean) as MenuItem[]
    })
  }

  const getItemQuantity = (itemId: number) => {
    const item = cart.find((cartItem) => cartItem.id === itemId)
    return item?.quantity || 0
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * (item.quantity || 0), 0)
  }

  // Persist cart to localStorage before routing to checkout
  const proceedToCheckout = () => {
    try {
      if (cart.length === 0) return
      localStorage.setItem('takeaway_cart', JSON.stringify(cart))
      // navigate
      router.push('/takeaway/checkout')
    } catch (err) {
      console.error('Failed to persist cart', err)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <div>
                <h1 className="font-sans font-bold text-lg text-foreground">Takeaway Menu</h1>
                <p className="text-xs text-muted-foreground">Spice Garden Restaurant</p>
              </div>
            </div>
            <Badge variant="secondary">Takeaway Only</Badge>
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

      <main className="max-w-md mx-auto p-4">
        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="popular" className="text-xs">
              Popular
            </TabsTrigger>
            <TabsTrigger value="starters" className="text-xs">
              Starters
            </TabsTrigger>
            <TabsTrigger value="mains" className="text-xs">
              Mains
            </TabsTrigger>
            <TabsTrigger value="biryani" className="text-xs">
              Biryani
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.slice(4).map((category) => (
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

        {/* Menu Items */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.isVeg && <Leaf className="w-4 h-4 text-green-600" />}
                        {item.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* rating is optional on server menu, guard access */}
                        {'rating' in item ? (
                          <>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">{(item as any).rating}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg text-foreground">₹{item.price}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{(item as any).prepTime ?? item.preparationTime ?? ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getItemQuantity(item.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium min-w-[20px] text-center">{getItemQuantity(item.id)}</span>
                            <Button size="sm" onClick={() => addToCart(item)} className="h-8 w-8 p-0">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(item)}>
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-24 h-24 m-4 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No items found matching your search.</p>
          </div>
        )}
      </main>

      {/* Cart Footer */}
          {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
          <div className="max-w-md mx-auto">
            <Button className="w-full h-12 text-base font-medium" onClick={proceedToCheckout}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Proceed to Checkout • {getTotalItems()} items • ₹{getTotalPrice()}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
