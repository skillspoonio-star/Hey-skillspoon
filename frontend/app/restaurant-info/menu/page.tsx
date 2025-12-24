"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Star, Clock, Leaf, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/loader"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
  prepTime: string
  rating: number
  isVeg: boolean
  isPopular?: boolean
  allergens?: string[]
  calories?: number
}

export default function RestaurantMenuPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("popular")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setIsLoading(true)
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/menu/items`)
        if (!res.ok) throw new Error("Failed to fetch menu items")
        const data = await res.json()
        setMenuItems(data)
      } catch (error) {
        console.error("Error fetching menu items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuItems()
  }, [])


  const categories = [
    { id: "popular", name: "Popular", count: menuItems.filter((item) => item.isPopular).length },
    { id: "starters", name: "Starters", count: menuItems.filter((item) => item.category === "starters").length },
    { id: "mains", name: "Main Course", count: menuItems.filter((item) => (item.category === "mains" || item.category === "Main Course")).length },
    { id: "biryani", name: "Biryani", count: menuItems.filter((item) => item.category === "biryani").length },
    { id: "breads", name: "Breads", count: menuItems.filter((item) => item.category === "Breads").length },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <Badge variant="secondary">View Only</Badge>
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

      <main className="max-w-4xl mx-auto p-4">
        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="popular" className="text-xs">
              Popular
            </TabsTrigger>
            <TabsTrigger value="starters" className="text-xs">
              Starters
            </TabsTrigger>
            <TabsTrigger value="Main Course" className="text-xs">
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
                variant={selectedCategory === category.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className="whitespace-nowrap text-xs"
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </Tabs>

        {/* Menu Items */}
        {isLoading ? (
          <InlineLoader text="Loading menu items..." size="md" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
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
                          <span className="text-sm text-muted-foreground">{item.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-foreground mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xl text-foreground">₹{item.price}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{item.prepTime}</span>
                          </div>
                        </div>

                        {item.calories && <p className="text-xs text-muted-foreground">{item.calories} calories</p>}

                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.allergens.map((allergen) => (
                              <Badge key={allergen} variant="outline" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            className="bg-transparent h-8"
                            onClick={() => (window.location.href = `/menu/${item.id}/reviews`)}
                          >
                            View Reviews
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="w-32 h-32 m-4 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
        )}

        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No items found matching your search.</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Ready to Order?</h3>
              <p className="text-muted-foreground mb-4">
                Visit our restaurant or order for takeaway to enjoy these delicious dishes.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push("/restaurant-info/reservations")}>Reserve Table</Button>
                <Button variant="outline" onClick={() => router.push("/takeaway")}>
                  Order Takeaway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
