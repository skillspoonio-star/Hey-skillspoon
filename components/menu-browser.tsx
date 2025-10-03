"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Star, Clock, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

const menuData: MenuItem[] = [
  {
    id: 1,
    name: "Butter Naan",
    description: "Soft, fluffy bread brushed with butter",
    price: 45,
    category: "Breads",
    image: "/butter-naan.png",
    rating: 4.5,
    prepTime: "10 min",
    isSpicy: false,
    isVeg: true,
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 2,
    name: "Paneer Tikka",
    description: "Grilled cottage cheese with aromatic spices",
    price: 280,
    category: "Starters",
    image: "/paneer-tikka-grilled.jpg",
    rating: 4.7,
    prepTime: "15 min",
    isSpicy: true,
    isVeg: true,
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 3,
    name: "Mango Lassi",
    description: "Refreshing yogurt drink with fresh mango",
    price: 120,
    category: "Beverages",
    image: "/mango-lassi.png",
    rating: 4.3,
    prepTime: "5 min",
    isSpicy: false,
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Chicken Biryani",
    description: "Aromatic basmati rice with tender chicken",
    price: 350,
    category: "Main Course",
    image: "/chicken-biryani-rice.jpg",
    rating: 4.8,
    prepTime: "25 min",
    isSpicy: true,
    isVeg: false,
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 5,
    name: "Dal Makhani",
    description: "Creamy black lentils slow-cooked with spices",
    price: 220,
    category: "Main Course",
    image: "/dal-makhani-curry.jpg",
    rating: 4.4,
    prepTime: "20 min",
    isSpicy: false,
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 6,
    name: "Gulab Jamun",
    description: "Sweet milk dumplings in sugar syrup",
    price: 80,
    category: "Desserts",
    image: "/gulab-jamun-dessert.png",
    rating: 4.2,
    prepTime: "5 min",
    isSpicy: false,
    isVeg: true,
    isAvailable: false,
  },
]

const categories = ["All", "Starters", "Main Course", "Breads", "Beverages", "Desserts"]

export function MenuBrowser({ onAddToOrder }: MenuBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = menuData.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToOrder = (item: MenuItem) => {
    if (!item.isAvailable) return

    onAddToOrder({
      id: Date.now(),
      item: item.name,
      quantity: 1,
      price: item.price,
    })
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
            {menuData
              .filter((item) => item.isPopular)
              .map((item) => (
                <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
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
              <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
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

function MenuItemCard({ item, onAddToOrder }: { item: MenuItem; onAddToOrder: (item: MenuItem) => void }) {
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
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
