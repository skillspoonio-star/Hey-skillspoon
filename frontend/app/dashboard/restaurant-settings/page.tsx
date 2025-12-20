"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Save,
    Upload,
    MapPin,
    Phone,
    Mail,
    Clock,
    Star,
    Image as ImageIcon,
    Settings,
    Info,
    Camera
} from "lucide-react"
import { InlineLoader } from "@/components/ui/loader"

interface RestaurantInfo {
    name: string
    description: string
    address: string
    phone: string
    email: string
    website: string
    openingHours: {
        monday: { open: string; close: string; closed: boolean }
        tuesday: { open: string; close: string; closed: boolean }
        wednesday: { open: string; close: string; closed: boolean }
        thursday: { open: string; close: string; closed: boolean }
        friday: { open: string; close: string; closed: boolean }
        saturday: { open: string; close: string; closed: boolean }
        sunday: { open: string; close: string; closed: boolean }
    }
    cuisine: string[]
    priceRange: string
    rating: number
    totalReviews: number
    images: string[]
    logo: string
    interiorImage: string
    isOpen: boolean
    features: string[]
}

export default function RestaurantSettingsPage() {
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
        name: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        openingHours: {
            monday: { open: "11:00", close: "23:00", closed: false },
            tuesday: { open: "11:00", close: "23:00", closed: false },
            wednesday: { open: "11:00", close: "23:00", closed: false },
            thursday: { open: "11:00", close: "23:00", closed: false },
            friday: { open: "11:00", close: "23:00", closed: false },
            saturday: { open: "11:00", close: "23:00", closed: false },
            sunday: { open: "11:00", close: "23:00", closed: false }
        },
        cuisine: [],
        priceRange: "$$",
        rating: 0,
        totalReviews: 0,
        images: [],
        logo: "",
        isOpen: true,
        features: []
    })

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [newCuisine, setNewCuisine] = useState("")
    const [newFeature, setNewFeature] = useState("")

    useEffect(() => {
        loadRestaurantInfo()
    }, [])

    const loadRestaurantInfo = async () => {
        try {
            setIsLoading(true)
            const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
            const response = await fetch(`${base}/api/restaurant/info`)

            if (response.ok) {
                const data = await response.json()
                setRestaurantInfo(data)
            } else {
                // Set default values if no data exists
                setRestaurantInfo(prev => ({
                    ...prev,
                    name: "Spice Garden Restaurant",
                    description: "Experience authentic Indian flavors in a warm, welcoming atmosphere. Our chefs use traditional recipes passed down through generations, combined with the finest ingredients to create memorable dining experiences.",
                    address: "123 Food Street, Sector 18, Noida, UP 201301",
                    phone: "+91 98765 43210",
                    email: "info@spicegarden.com",
                    website: "www.spicegarden.com",
                    cuisine: ["Indian", "North Indian", "Biryani", "Vegetarian"],
                    priceRange: "$$",
                    rating: 4.5,
                    totalReviews: 1250,
                    features: ["Dine-in", "Takeaway", "Home Delivery", "Voice Ordering", "Online Payment"]
                }))
            }
        } catch (error) {
            console.error('Failed to load restaurant info:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const saveRestaurantInfo = async () => {
        try {
            setIsSaving(true)
            const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
            const response = await fetch(`${base}/api/restaurant/info`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(restaurantInfo)
            })

            if (response.ok) {
                alert('Restaurant information updated successfully!')
            } else {
                alert('Failed to update restaurant information')
            }
        } catch (error) {
            console.error('Failed to save restaurant info:', error)
            alert('Failed to update restaurant information')
        } finally {
            setIsSaving(false)
        }
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'gallery') => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string
                if (type === 'logo') {
                    setRestaurantInfo(prev => ({ ...prev, logo: imageUrl }))
                } else {
                    setRestaurantInfo(prev => ({
                        ...prev,
                        images: [...prev.images, imageUrl]
                    }))
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const addCuisine = () => {
        if (newCuisine.trim() && !restaurantInfo.cuisine.includes(newCuisine.trim())) {
            setRestaurantInfo(prev => ({
                ...prev,
                cuisine: [...prev.cuisine, newCuisine.trim()]
            }))
            setNewCuisine("")
        }
    }

    const removeCuisine = (cuisine: string) => {
        setRestaurantInfo(prev => ({
            ...prev,
            cuisine: prev.cuisine.filter(c => c !== cuisine)
        }))
    }

    const addFeature = () => {
        if (newFeature.trim() && !restaurantInfo.features.includes(newFeature.trim())) {
            setRestaurantInfo(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }))
            setNewFeature("")
        }
    }

    const removeFeature = (feature: string) => {
        setRestaurantInfo(prev => ({
            ...prev,
            features: prev.features.filter(f => f !== feature)
        }))
    }

    const removeImage = (index: number) => {
        setRestaurantInfo(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <InlineLoader text="Loading restaurant settings..." size="md" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Restaurant Settings</h1>
                    <p className="text-muted-foreground">Manage your restaurant information and settings</p>
                </div>
                <Button
                    onClick={saveRestaurantInfo}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    {isSaving ? <InlineLoader size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="hours">Hours & Contact</TabsTrigger>
                    <TabsTrigger value="media">Images & Media</TabsTrigger>
                    <TabsTrigger value="features">Features & Tags</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Restaurant Name</Label>
                                    <Input
                                        id="name"
                                        value={restaurantInfo.name}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter restaurant name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="priceRange">Price Range</Label>
                                    <select
                                        id="priceRange"
                                        value={restaurantInfo.priceRange}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, priceRange: e.target.value }))}
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                    >
                                        <option value="$">$ - Budget Friendly</option>
                                        <option value="$$">$$ - Moderate</option>
                                        <option value="$$$">$$$ - Expensive</option>
                                        <option value="$$$$">$$$$ - Fine Dining</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={restaurantInfo.description}
                                    onChange={(e) => setRestaurantInfo(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe your restaurant..."
                                    rows={4}
                                />
                            </div>

                            <div>
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={restaurantInfo.address}
                                    onChange={(e) => setRestaurantInfo(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter full address"
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isOpen"
                                    checked={restaurantInfo.isOpen}
                                    onCheckedChange={(checked) => setRestaurantInfo(prev => ({ ...prev, isOpen: checked }))}
                                />
                                <Label htmlFor="isOpen">Restaurant is currently open</Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hours" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Operating Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(restaurantInfo.openingHours).map(([day, hours]) => (
                                <div key={day} className="flex items-center gap-4">
                                    <div className="w-24 capitalize font-medium">{day}</div>
                                    <Switch
                                        checked={!hours.closed}
                                        onCheckedChange={(checked) =>
                                            setRestaurantInfo(prev => ({
                                                ...prev,
                                                openingHours: {
                                                    ...prev.openingHours,
                                                    [day]: { ...hours, closed: !checked }
                                                }
                                            }))
                                        }
                                    />
                                    {!hours.closed ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={hours.open}
                                                onChange={(e) =>
                                                    setRestaurantInfo(prev => ({
                                                        ...prev,
                                                        openingHours: {
                                                            ...prev.openingHours,
                                                            [day]: { ...hours, open: e.target.value }
                                                        }
                                                    }))
                                                }
                                                className="w-32"
                                            />
                                            <span>to</span>
                                            <Input
                                                type="time"
                                                value={hours.close}
                                                onChange={(e) =>
                                                    setRestaurantInfo(prev => ({
                                                        ...prev,
                                                        openingHours: {
                                                            ...prev.openingHours,
                                                            [day]: { ...hours, close: e.target.value }
                                                        }
                                                    }))
                                                }
                                                className="w-32"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">Closed</span>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="w-5 h-5" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={restaurantInfo.phone}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={restaurantInfo.email}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="info@restaurant.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={restaurantInfo.website}
                                    onChange={(e) => setRestaurantInfo(prev => ({ ...prev, website: e.target.value }))}
                                    placeholder="www.restaurant.com"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5" />
                                Restaurant Logo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                {restaurantInfo.logo ? (
                                    <img
                                        src={restaurantInfo.logo}
                                        alt="Restaurant Logo"
                                        className="w-24 h-24 object-cover rounded-lg border"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="logo-upload" className="cursor-pointer">
                                        <Button variant="outline" asChild>
                                            <span>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Logo
                                            </span>
                                        </Button>
                                    </Label>
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'logo')}
                                        className="hidden"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Recommended: Square image, 200x200px minimum
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Restaurant Gallery
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {restaurantInfo.images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={image}
                                            alt={`Restaurant ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                                <Label htmlFor="gallery-upload" className="cursor-pointer">
                                    <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center hover:border-muted-foreground/50 transition-colors">
                                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Add Photo</span>
                                    </div>
                                </Label>
                                <Input
                                    id="gallery-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'gallery')}
                                    className="hidden"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cuisine Types</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {restaurantInfo.cuisine.map((cuisine) => (
                                    <Badge key={cuisine} variant="secondary" className="cursor-pointer" onClick={() => removeCuisine(cuisine)}>
                                        {cuisine} ×
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newCuisine}
                                    onChange={(e) => setNewCuisine(e.target.value)}
                                    placeholder="Add cuisine type"
                                    onKeyPress={(e) => e.key === 'Enter' && addCuisine()}
                                />
                                <Button onClick={addCuisine}>Add</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurant Features</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {restaurantInfo.features.map((feature) => (
                                    <Badge key={feature} variant="outline" className="cursor-pointer" onClick={() => removeFeature(feature)}>
                                        {feature} ×
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="Add feature"
                                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                />
                                <Button onClick={addFeature}>Add</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5" />
                                Rating & Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="rating">Average Rating</Label>
                                    <Input
                                        id="rating"
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={restaurantInfo.rating}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="totalReviews">Total Reviews</Label>
                                    <Input
                                        id="totalReviews"
                                        type="number"
                                        min="0"
                                        value={restaurantInfo.totalReviews}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, totalReviews: parseInt(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}