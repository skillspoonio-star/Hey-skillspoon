"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  Download,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  ChefHat,
  Leaf,
  Flame,
  Eye,
  Copy,
} from "lucide-react"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  isVeg: boolean
  isSpicy: boolean
  isPopular?: boolean
  prepTime: string
  image?: string
  ingredients?: string[]
  allergens?: string[]
  calories?: number
  rating?: number
  popularity?: number
  cost?: number
  profit?: number
  tags?: string[]
}

interface MenuCategory {
  id: string
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

const initialMenuItems: MenuItem[] = []

const initialCategories: MenuCategory[] = [
  { id: "starters", name: "Starters", description: "Appetizers and small plates", isActive: true, sortOrder: 1 },
  { id: "main-course", name: "Main Course", description: "Primary dishes and entrees", isActive: true, sortOrder: 2 },
  { id: "breads", name: "Breads", description: "Fresh baked breads and naans", isActive: true, sortOrder: 3 },
  { id: "beverages", name: "Beverages", description: "Drinks and refreshments", isActive: true, sortOrder: 4 },
  { id: "desserts", name: "Desserts", description: "Sweet treats and desserts", isActive: true, sortOrder: 5 },
]

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingFormData, setEditingFormData] = useState<MenuItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "analytics">("grid")
  const [sortBy, setSortBy] = useState<"name" | "price" | "popularity" | "profit">("name")
  const [filterBy, setFilterBy] = useState<"all" | "available" | "unavailable" | "veg" | "non-veg">("all")

  // Fetch menu items from backend and poll for updates
  React.useEffect(() => {
    let mounted = true
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

    const load = async () => {
      try {
  const res = await fetch(`${base}/api/menu/items?all=true`)
        if (!res.ok) {
          console.error('Failed to fetch menu items', await res.text())
          return
        }
        const items = await res.json()
        if (!mounted) return
        setMenuItems(items)
      } catch (err) {
        console.error('Failed to fetch menu items', err)
      }
    }

    load()
    const t = setInterval(load, 5000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [])

  const filteredItems = menuItems
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ingredients?.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "available" && item.isAvailable) ||
        (filterBy === "unavailable" && !item.isAvailable) ||
        (filterBy === "veg" && item.isVeg) ||
        (filterBy === "non-veg" && !item.isVeg)

      return matchesSearch && matchesCategory && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return b.price - a.price
        case "popularity":
          return (b.popularity || 0) - (a.popularity || 0)
        case "profit":
          return (b.profit || 0) - (a.profit || 0)
        default:
          return a.name.localeCompare(b.name)
      }
    })

  // Toggle availability and persist to backend
  const toggleAvailability = async (id: number) => {
    // optimistic update
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item)))
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${base}/api/menu/items/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isAvailable: !(menuItems.find((m) => m.id === id)?.isAvailable) }),
      })
      if (!res.ok) {
        // revert optimistic update on failure
        setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item)))
        console.error('Failed to update availability', await res.text())
      }
    } catch (err) {
      // revert optimistic update
      setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item)))
      console.error('Failed to update availability', err)
    }
  }

  const deleteItem = async (id: number) => {
    // attempt server delete, then update local state
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch(`${base}/api/menu/items/${id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        console.error('Failed to delete item', await res.text())
        // still remove locally to keep UI responsive, optionally you can keep it
      }
    } catch (err) {
      console.error('Failed to delete item', err)
    }
    setMenuItems((prev) => prev.filter((item) => item.id !== id))
  }

  const duplicateItem = (item: MenuItem) => {
    const newItem = { ...item, id: Date.now(), name: `${item.name} (Copy)` }
    setMenuItems((prev) => [...prev, newItem])
  }

  // Toggle popularity flag and persist it
  const togglePopular = async (id: number) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isPopular: !item.isPopular } : item)))
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${base}/api/menu/items/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isPopular: !(menuItems.find((m) => m.id === id)?.isPopular) }),
      })
      if (!res.ok) {
        setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isPopular: !item.isPopular } : item)))
        console.error('Failed to update popularity', await res.text())
      }
    } catch (err) {
      setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isPopular: !item.isPopular } : item)))
      console.error('Failed to update popularity', err)
    }
  }

  const saveItem = async (item: MenuItem) => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    if (editingItem) {
      // update existing item on server
      try {
        const res = await fetch(`${base}/api/menu/items/${item.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(item),
        })
        if (!res.ok) {
          console.error('Failed to update item', await res.text())
          return
        }
        const updated = await res.json()
        setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        setEditingItem(null)
      } catch (err) {
        console.error('Failed to update item', err)
      }
    } else {
      // create new item on server - ensure a client id if none provided
      const payload = { ...item, id: item.id && item.id !== 0 ? item.id : Date.now() }
      try {
        const res = await fetch(`${base}/api/menu/items`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          console.error('Failed to create item', await res.text())
          return
        }
        const created = await res.json()
        setMenuItems((prev) => [...prev, created])
        setShowAddForm(false)
      } catch (err) {
        console.error('Failed to create item', err)
      }
    }
  }

  const getMenuStats = () => {
    const totalItems = menuItems.length
    const availableItems = menuItems.filter((item) => item.isAvailable).length
    const vegItems = menuItems.filter((item) => item.isVeg).length
    const avgPrice = menuItems.reduce((sum, item) => sum + item.price, 0) / totalItems
    const totalProfit = menuItems.reduce((sum, item) => sum + (item.profit || 0), 0)

    return { totalItems, availableItems, vegItems, avgPrice, totalProfit }
  }

  const stats = getMenuStats()

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-primary">{stats.totalItems}</p>
              </div>
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-chart-2">{stats.availableItems}</p>
              </div>
              <Eye className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vegetarian</p>
                <p className="text-2xl font-bold text-chart-2">{stats.vegItems}</p>
              </div>
              <Leaf className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Price</p>
                <p className="text-2xl font-bold text-accent">₹{Math.round(stats.avgPrice)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold text-primary">₹{stats.totalProfit}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search menu items, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories
                .filter((cat) => cat.isActive)
                .map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
              <SelectItem value="veg">Vegetarian</SelectItem>
              <SelectItem value="non-veg">Non-Veg</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className={` ${!item.isAvailable ? "opacity-60" : ""} cursor-pointer`} onClick={() => setEditingItem(item)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {item.isPopular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.image && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">₹{item.price}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.category}</Badge>
                    {item.popularity && (
                      <Badge variant="secondary" className="text-xs">
                        {item.popularity}% popular
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant={item.isVeg ? "secondary" : "destructive"} className="text-xs">
                    {item.isVeg ? "VEG" : "NON-VEG"}
                  </Badge>
                  {item.isSpicy && (
                    <Badge variant="outline" className="text-xs">
                      <Flame className="w-3 h-3 mr-1" />
                      Spicy
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.prepTime}
                  </Badge>
                  {item.calories && (
                    <Badge variant="outline" className="text-xs">
                      {item.calories} cal
                    </Badge>
                  )}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {item.profit && (
                  <div className="text-xs text-muted-foreground">
                    Cost: ₹{item.cost} • Profit: ₹{item.profit} ({Math.round((item.profit / item.price) * 100)}%)
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor={`available-${item.id}`} className="text-sm">
                    Available
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`available-${item.id}`}
                      checked={item.isAvailable}
                      onCheckedChange={(v) => { v; toggleAvailability(item.id); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Item</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Cost</th>
                    <th className="p-4 font-medium">Profit</th>
                    <th className="p-4 font-medium">Popularity</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setEditingItem(item)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-4 font-medium">₹{item.price}</td>
                      <td className="p-4">₹{item.cost || 0}</td>
                      <td className="p-4 text-chart-2">₹{item.profit || 0}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${item.popularity || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{item.popularity || 0}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {item.isAvailable ? (
                            <Badge variant="secondary">Available</Badge>
                          ) : (
                            <Badge variant="outline">Unavailable</Badge>
                          )}
                          <Switch checked={item.isAvailable} onCheckedChange={() => toggleAvailability(item.id)} />
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex gap-1 justify-end">
                          <Button className="flex-shrink-0" size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); duplicateItem(item); }}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button className="flex-shrink-0" size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems
                  .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">₹{item.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.popularity}%</div>
                        <div className="text-xs text-muted-foreground">popularity</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Profitable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems
                  .sort((a, b) => (b.profit || 0) - (a.profit || 0))
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">₹{item.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-chart-2">₹{item.profit}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(((item.profit || 0) / item.price) * 100)}% margin
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={showAddForm || !!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false)
            setEditingItem(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
          </DialogHeader>
          <div>
            <MenuItemForm
              item={editingItem}
              categories={categories}
              onSave={saveItem}
              onCancel={() => {
                setEditingItem(null)
                setShowAddForm(false)
              }}
              onChange={(data) => setEditingFormData(data)}
            />

            {/* Dialog footer: Delete (left) and Confirm (right) */}
            <div className="flex items-center justify-between mt-4">
              <div>
                {editingItem && (
                  <Button variant="destructive" onClick={() => { if (editingItem) { deleteItem(editingItem.id); setEditingItem(null); } }}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div>
                <Button onClick={async () => {
                  if (!editingFormData) return
                  await saveItem(editingFormData)
                }}>
                  {editingItem ? 'Confirm update' : 'Add item'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MenuItemForm({
  item,
  categories,
  onSave,
  onCancel,
  onChange,
}: {
  item: MenuItem | null
  categories: MenuCategory[]
  onSave: (item: MenuItem) => void
  onCancel: () => void
  onChange?: (item: MenuItem) => void
}) {
  const [formData, setFormData] = useState<MenuItem>(
    item || {
      id: 0,
      name: "",
      description: "",
      price: 0,
      category: "Main Course",
      isAvailable: true,
      isVeg: true,
  isPopular: false,
      isSpicy: false,
      prepTime: "15 min",
      ingredients: [],
      allergens: [],
      calories: 0,
      rating: 0,
      popularity: 0,
      cost: 0,
      profit: 0,
      tags: [],
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Calculate profit if cost and price are provided
    if (formData.cost && formData.price) {
      formData.profit = formData.price - formData.cost
    }
    onSave(formData)
  }

  React.useEffect(() => {
    if (onChange) onChange(formData)
  }, [formData, onChange])

  const addIngredient = (ingredient: string) => {
    if (ingredient && !formData.ingredients?.includes(ingredient)) {
      setFormData({
        ...formData,
        ingredients: [...(formData.ingredients || []), ingredient],
      })
    }
  }

  const removeIngredient = (ingredient: string) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients?.filter((ing) => ing !== ingredient) || [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((cat) => cat.isActive)
                .map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="cost">Cost (₹)</Label>
          <Input
            id="cost"
            type="number"
            value={formData.cost || ""}
            onChange={(e) => setFormData({ ...formData, cost: Number.parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="prepTime">Prep Time *</Label>
          <Input
            id="prepTime"
            value={formData.prepTime}
            onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
            placeholder="15 min"
            required
          />
        </div>
        <div>
          <Label htmlFor="calories">Calories</Label>
          <Input
            id="calories"
            type="number"
            value={formData.calories || ""}
            onChange={(e) => setFormData({ ...formData, calories: Number.parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="isVeg">Vegetarian</Label>
          <Switch
            id="isVeg"
            checked={formData.isVeg}
            onCheckedChange={(checked) => setFormData({ ...formData, isVeg: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="isSpicy">Spicy</Label>
          <Switch
            id="isSpicy"
            checked={formData.isSpicy}
            onCheckedChange={(checked) => setFormData({ ...formData, isSpicy: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="isPopular">Popular</Label>
          <Switch
            id="isPopular"
            checked={formData.isPopular}
            onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
          />
        </div>
      </div>

      <div>
        <Label>Ingredients</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Add ingredient..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addIngredient(e.currentTarget.value)
                e.currentTarget.value = ""
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.ingredients?.map((ingredient, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeIngredient(ingredient)}
            >
              {ingredient} ×
            </Badge>
          ))}
        </div>
      </div>

    </form>
  )
}
