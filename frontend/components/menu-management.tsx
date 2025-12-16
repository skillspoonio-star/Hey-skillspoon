"use client"

import React, { useState, useEffect } from "react"
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
import { InlineLoader } from "@/components/ui/loader"

// Configuration constants
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? '₹'
const CURRENCY_LOCALE = process.env.NEXT_PUBLIC_CURRENCY_LOCALE ?? 'en-IN'
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

export interface MenuItem {
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

export interface MenuCategory {
  id: string
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

// Default categories configuration
const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: "starters", name: "Starters", description: "Appetizers and small plates", isActive: true, sortOrder: 1 },
  { id: "main-course", name: "Main Course", description: "Primary dishes and entrees", isActive: true, sortOrder: 2 },
  { id: "breads", name: "Breads", description: "Fresh baked breads and naans", isActive: true, sortOrder: 3 },
  { id: "beverages", name: "Beverages", description: "Drinks and refreshments", isActive: true, sortOrder: 4 },
  { id: "desserts", name: "Desserts", description: "Sweet treats and desserts", isActive: true, sortOrder: 5 },
]

const initialMenuItems: MenuItem[] = []

// Currency formatter function
const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return `${CURRENCY_SYMBOL}0`

  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: 'currency',
      currency: CURRENCY_SYMBOL === '₹' ? 'INR' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  } catch (e) {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString()}`
  }
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [categories, setCategories] = useState<MenuCategory[]>(DEFAULT_CATEGORIES)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingFormData, setEditingFormData] = useState<MenuItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "analytics">("grid")
  const [sortBy, setSortBy] = useState<"name" | "price" | "popularity" | "profit">("name")
  const [filterBy, setFilterBy] = useState<"all" | "available" | "unavailable" | "veg" | "non-veg">("all")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch menu items from backend on mount only
  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`${API_BASE}/api/menu/items?all=true`)
        if (!res.ok) {
          console.error('Failed to fetch menu items', await res.text())
          return
        }
        const items = await res.json()
        if (!mounted) return
        setMenuItems(items)
      } catch (err) {
        console.error('Failed to fetch menu items', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    // Removed auto-refresh interval to prevent constant reloading
    return () => {
      mounted = false
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/menu/items/${id}`, {
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch(`${API_BASE}/api/menu/items/${id}`, { method: 'DELETE', headers })
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

  const clearAllItems = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${menuItems.length} menu items? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      // Delete all items from server
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const deletePromises = menuItems.map(item =>
        fetch(`${API_BASE}/api/menu/items/${item.id}`, {
          method: 'DELETE',
          headers
        }).catch(err => console.error(`Failed to delete item ${item.id}:`, err))
      )

      await Promise.allSettled(deletePromises)

      // Clear local state
      setMenuItems([])

      alert('All menu items have been deleted successfully.')
    } catch (err) {
      console.error('Failed to clear all items:', err)
      alert('Some items may not have been deleted. Please check the server.')
    }
  }

  const importMenuItems = async (file: File) => {
    try {
      const text = await file.text()
      let importedItems: any[]

      // Parse JSON file
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text)
        // Handle both array format and object with items property
        importedItems = Array.isArray(data) ? data : (data.items || data.menuItems || [])
      } else {
        alert('Please upload a JSON file.')
        return
      }

      if (!Array.isArray(importedItems) || importedItems.length === 0) {
        alert('No valid menu items found in the file.')
        return
      }

      // Validate and transform imported items
      const validItems: MenuItem[] = []
      const errors: string[] = []

      importedItems.forEach((item, index) => {
        try {
          // Validate required fields
          if (!item.name || typeof item.name !== 'string') {
            errors.push(`Item ${index + 1}: Missing or invalid name`)
            return
          }
          if (!item.description || typeof item.description !== 'string') {
            errors.push(`Item ${index + 1}: Missing or invalid description`)
            return
          }
          if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
            errors.push(`Item ${index + 1}: Missing or invalid price`)
            return
          }

          // Create menu item with defaults for missing fields
          const menuItem: MenuItem = {
            id: Date.now() + index, // Generate unique ID
            name: item.name.trim(),
            description: item.description.trim(),
            price: Number(item.price),
            category: item.category || 'Main Course',
            isAvailable: item.isAvailable !== false, // Default to true
            isVeg: item.isVeg === true, // Default to false
            isSpicy: item.isSpicy === true, // Default to false
            isPopular: item.isPopular === true, // Default to false
            prepTime: item.prepTime || '15 min',
            image: item.image || undefined,
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            allergens: Array.isArray(item.allergens) ? item.allergens : [],
            calories: item.calories ? Number(item.calories) : undefined,
            rating: item.rating ? Number(item.rating) : undefined,
            popularity: item.popularity ? Number(item.popularity) : undefined,
            cost: item.cost ? Number(item.cost) : undefined,
            profit: item.profit ? Number(item.profit) : (item.cost ? Number(item.price) - Number(item.cost) : undefined),
            tags: Array.isArray(item.tags) ? item.tags : []
          }

          validItems.push(menuItem)
        } catch (err) {
          errors.push(`Item ${index + 1}: ${err instanceof Error ? err.message : 'Invalid format'}`)
        }
      })

      if (errors.length > 0) {
        const showErrors = errors.slice(0, 5).join('\n')
        const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''
        alert(`Found ${errors.length} errors:\n${showErrors}${moreErrors}\n\nValid items will still be imported.`)
      }

      if (validItems.length === 0) {
        alert('No valid items to import.')
        return
      }

      // Ask for confirmation
      const confirmed = window.confirm(
        `Import ${validItems.length} menu items? ${errors.length > 0 ? `(${errors.length} items had errors and will be skipped)` : ''}`
      )
      if (!confirmed) return

      // Save items to server
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      let successCount = 0
      let failCount = 0

      for (const item of validItems) {
        try {
          const res = await fetch(`${API_BASE}/api/menu/items`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(item),
          })

          if (res.ok) {
            const created = await res.json()
            setMenuItems(prev => [...prev, created])
            successCount++
          } else {
            console.error(`Failed to create item ${item.name}:`, await res.text())
            failCount++
          }
        } catch (err) {
          console.error(`Failed to create item ${item.name}:`, err)
          failCount++
        }
      }

      alert(`Import completed!\nSuccessfully imported: ${successCount} items\nFailed: ${failCount} items`)

    } catch (err) {
      console.error('Import failed:', err)
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Toggle popularity flag and persist it
  const togglePopular = async (id: number) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, isPopular: !item.isPopular } : item)))
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/menu/items/${id}`, {
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    if (editingItem) {
      // update existing item on server
      try {
        const res = await fetch(`${API_BASE}/api/menu/items/${item.id}`, {
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
        const res = await fetch(`${API_BASE}/api/menu/items`, {
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

  if (isLoading) {
    return <InlineLoader text="Loading menu items..." size="md" />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-hidden">
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                <p className="text-2xl font-bold truncate">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">Menu items</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-2xl font-bold truncate">{stats.availableItems}</p>
                <p className="text-xs text-muted-foreground">Ready to order</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Vegetarian</p>
                <p className="text-2xl font-bold truncate">{stats.vegItems}</p>
                <p className="text-xs text-muted-foreground">Veg options</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Avg Price</p>
                <p className="text-2xl font-bold truncate" title={formatCurrency(Math.round(stats.avgPrice || 0))}>
                  {formatCurrency(Math.round(stats.avgPrice || 0))}
                </p>
                <p className="text-xs text-muted-foreground">Per item</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
                <p className="text-2xl font-bold truncate" title={formatCurrency(stats.totalProfit || 0)}>
                  {formatCurrency(stats.totalProfit || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Estimated</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Header */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {/* Top Row - Search and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search menu items, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      importMenuItems(file)
                    }
                  }
                  input.click()
                }}
                title="Import menu items from JSON file. Required fields: name, description, price"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={() => {
                  const dataStr = JSON.stringify(menuItems, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `menu-items-${new Date().toISOString().split('T')[0]}.json`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              {menuItems.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="hidden sm:flex"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Menu Items</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all {menuItems.length} menu items?
                        This action cannot be undone and will remove all items from your menu.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearAllItems}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete All Items
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Bottom Row - Filters and View Mode */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Filter:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
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
              </div>

              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non-veg">Non-Veg</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Sort:</span>
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
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">View:</span>
              <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Mobile Actions Row */}
          <div className="flex sm:hidden items-center gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.json'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    importMenuItems(file)
                  }
                }
                input.click()
              }}
              title="Import menu items from JSON file"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const dataStr = JSON.stringify(menuItems, null, 2)
                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `menu-items-${new Date().toISOString().split('T')[0]}.json`
                link.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className={`${!item.isAvailable ? "opacity-60" : ""} cursor-pointer hover:shadow-lg transition-all duration-200 shadow-sm`} onClick={() => setEditingItem(item)}>
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
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group" onClick={(e) => e.stopPropagation()}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No image</p>
                      </div>
                    </div>
                  )}

                  {/* Hover overlay for edit hint */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium">Click to edit</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{formatCurrency(item.price)}</span>
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
                    Cost: {formatCurrency(item.cost || 0)} • Profit: {formatCurrency(item.profit || 0)} ({Math.round(((item.profit || 0) / item.price) * 100)}%)
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
        <Card className="shadow-sm">
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
                          <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Upload className="w-4 h-4 text-muted-foreground opacity-50" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-4 font-medium">{formatCurrency(item.price)}</td>
                      <td className="p-4">{formatCurrency(item.cost || 0)}</td>
                      <td className="p-4 text-chart-2">{formatCurrency(item.profit || 0)}</td>
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
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
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

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Most Profitable</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-chart-2">{formatCurrency(item.profit || 0)}</div>
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

  useEffect(() => {
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

  const handleImageUpload = (file: File) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Convert to base64 for preview (in a real app, you'd upload to a server)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setFormData({ ...formData, image: result })
    }
    reader.onerror = () => {
      alert('Failed to read the image file')
    }
    reader.readAsDataURL(file)
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

      {/* Image Section */}
      <div className="space-y-4">
        <Label>Item Image</Label>

        {/* Current Image Preview */}
        {formData.image && (
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={formData.image}
                alt="Item preview"
                className="w-32 h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                onClick={() => setFormData({ ...formData, image: "" })}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">Current image</p>
              <p className="text-xs text-muted-foreground break-all">{formData.image}</p>
            </div>
          </div>
        )}

        {/* Image Input Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* URL Input */}
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image || ""}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          {/* File Upload */}
          <div>
            <Label>Upload Image</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-primary')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary')
                const file = e.dataTransfer.files?.[0]
                if (file) {
                  handleImageUpload(file)
                }
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    handleImageUpload(file)
                  }
                }
                input.click()
              }}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="price">Price ({CURRENCY_SYMBOL}) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="cost">Cost ({CURRENCY_SYMBOL})</Label>
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
