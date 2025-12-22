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
import { useToast } from "@/components/providers/toast-provider"

interface RestaurantInfo {
    name: string
    description: string
    address: string
    location: string
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
    const { success, error, info } = useToast()
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
        name: "",
        description: "",
        address: "",
        location: "",
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
        priceRange: "$",
        rating: 0,
        totalReviews: 0,
        images: [],
        logo: "",
        interiorImage: "",
        isOpen: true,
        features: []
    })

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
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
            } else if (response.status === 404) {
                // No restaurant data exists yet - keep empty state for user to fill
                console.log('No restaurant data found - user can create new restaurant profile')
            } else {
                console.error('Failed to load restaurant info:', response.statusText)
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
                const result = await response.json()
                console.log('Restaurant info saved successfully:', result)
                success('Restaurant information updated successfully!', 'Settings Saved')
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                console.error('Failed to save restaurant info:', errorData)
                error(`Failed to update restaurant information: ${errorData.error || response.statusText}`, 'Save Failed')
            }
        } catch (err) {
            console.error('Failed to save restaurant info:', err)
            error(`Failed to update restaurant information: ${err instanceof Error ? err.message : 'Network error'}`, 'Save Failed')
        } finally {
            setIsSaving(false)
        }
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'gallery' | 'interior') => {
        const file = event.target.files?.[0]
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                error('Image size must be less than 5MB. Please choose a smaller image or compress it.', 'File Too Large')
                return
            }

            setIsUploadingImage(true)
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    try {
                        // Create canvas for image compression
                        const canvas = document.createElement('canvas')
                        const ctx = canvas.getContext('2d')

                        // Calculate new dimensions (max 1200px width, maintain aspect ratio)
                        let { width, height } = img
                        const maxWidth = type === 'logo' ? 400 : 1200
                        const maxHeight = type === 'logo' ? 400 : 800

                        if (width > maxWidth) {
                            height = (height * maxWidth) / width
                            width = maxWidth
                        }
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height
                            height = maxHeight
                        }

                        canvas.width = width
                        canvas.height = height

                        // Draw and compress image
                        ctx?.drawImage(img, 0, 0, width, height)
                        const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.8) // 80% quality

                        if (type === 'logo') {
                            setRestaurantInfo(prev => ({ ...prev, logo: compressedImageUrl }))
                        } else if (type === 'interior') {
                            setRestaurantInfo(prev => ({ ...prev, interiorImage: compressedImageUrl }))
                        } else {
                            setRestaurantInfo(prev => ({
                                ...prev,
                                images: [...prev.images, compressedImageUrl]
                            }))
                        }
                        success(`${type === 'logo' ? 'Logo' : type === 'interior' ? 'Interior image' : 'Gallery image'} uploaded successfully!`, 'Image Uploaded')
                    } catch (err) {
                        console.error('Error processing image:', err)
                        error('Failed to process image. Please try a different image.', 'Processing Failed')
                    } finally {
                        setIsUploadingImage(false)
                    }
                }
                img.onerror = () => {
                    error('Failed to load image. Please try a different image.', 'Invalid Image')
                    setIsUploadingImage(false)
                }
                img.src = e.target?.result as string
            }
            reader.onerror = () => {
                error('Failed to read image file. Please try again.', 'File Read Error')
                setIsUploadingImage(false)
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-orange-50/30 dark:from-gray-900 dark:via-background dark:to-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg mb-4">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                        Restaurant Settings
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Manage your restaurant information, operating hours, media gallery, and features
                    </p>
                    <Button
                        onClick={saveRestaurantInfo}
                        disabled={isSaving}
                        size="lg"
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        {isSaving ? <InlineLoader size="sm" /> : <Save className="w-5 h-5 mr-2" />}
                        Save All Changes
                    </Button>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="basic" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-card/50 backdrop-blur-sm border shadow-sm">
                        <TabsTrigger
                            value="basic"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                        >
                            <Info className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Basic Info</span>
                            <span className="sm:hidden">Info</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="hours"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Hours & Contact</span>
                            <span className="sm:hidden">Hours</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="media"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Media</span>
                            <span className="sm:hidden">Media</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="features"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                        >
                            <Star className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Features</span>
                            <span className="sm:hidden">Features</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-6">
                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                        <Info className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium">Restaurant Name</Label>
                                        <Input
                                            id="name"
                                            value={restaurantInfo.name}
                                            onChange={(e) => setRestaurantInfo(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter restaurant name"
                                            className="h-11 border-2 focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priceRange" className="text-sm font-medium">Price Range</Label>
                                        <select
                                            id="priceRange"
                                            value={restaurantInfo.priceRange}
                                            onChange={(e) => setRestaurantInfo(prev => ({ ...prev, priceRange: e.target.value }))}
                                            className="w-full h-11 rounded-md border-2 border-input bg-background px-3 py-2 focus:border-orange-500 transition-colors"
                                        >
                                            <option value="$">$ - Budget Friendly</option>
                                            <option value="$$">$$ - Moderate</option>
                                            <option value="$$$">$$$ - Expensive</option>
                                            <option value="$$$$">$$$$ - Fine Dining</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={restaurantInfo.description}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe your restaurant's atmosphere, cuisine, and unique features..."
                                        rows={4}
                                        className="border-2 focus:border-orange-500 transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={restaurantInfo.address}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Enter complete address with landmarks"
                                        rows={3}
                                        className="border-2 focus:border-orange-500 transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-medium">Google Maps Location</Label>
                                    <Input
                                        id="location"
                                        value={restaurantInfo.location}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="Enter Google Maps URL or coordinates"
                                        className="h-11 border-2 focus:border-orange-500 transition-colors"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Paste Google Maps share link or coordinates (e.g., 28.6139,77.2090)
                                    </p>
                                </div>

                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200 dark:border-green-800">
                                    <Switch
                                        id="isOpen"
                                        checked={restaurantInfo.isOpen}
                                        onCheckedChange={(checked) => setRestaurantInfo(prev => ({ ...prev, isOpen: checked }))}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                    <Label htmlFor="isOpen" className="text-sm font-medium cursor-pointer">
                                        Restaurant is currently open for business
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6">
                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Operating Hours
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {Object.entries(restaurantInfo.openingHours).map(([day, hours]) => (
                                    <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="w-28 capitalize font-medium text-sm">{day}</div>
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
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                        {!hours.closed ? (
                                            <div className="flex items-center gap-3 flex-1">
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
                                                    className="w-32 h-9 border-2 focus:border-blue-500 transition-colors"
                                                />
                                                <span className="text-muted-foreground font-medium">to</span>
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
                                                    className="w-32 h-9 border-2 focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground font-medium flex-1">Closed</span>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                        <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={restaurantInfo.phone}
                                            onChange={(e) => setRestaurantInfo(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="Enter phone number"
                                            className="h-11 border-2 focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={restaurantInfo.email}
                                            onChange={(e) => setRestaurantInfo(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="info@restaurant.com"
                                            className="h-11 border-2 focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Website
                                    </Label>
                                    <Input
                                        id="website"
                                        value={restaurantInfo.website}
                                        onChange={(e) => setRestaurantInfo(prev => ({ ...prev, website: e.target.value }))}
                                        placeholder="www.restaurant.com"
                                        className="h-11 border-2 focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="media" className="space-y-6">
                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    Restaurant Logo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    {restaurantInfo.logo ? (
                                        <div className="relative group">
                                            <img
                                                src={restaurantInfo.logo}
                                                alt="Restaurant Logo"
                                                className="w-32 h-32 object-cover rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setRestaurantInfo(prev => ({ ...prev, logo: "" }))}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl flex items-center justify-center border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                                            <ImageIcon className="w-12 h-12 text-emerald-500" />
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <Label htmlFor="logo-upload" className="cursor-pointer">
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                disabled={isUploadingImage}
                                            >
                                                <span>
                                                    {isUploadingImage ? (
                                                        <InlineLoader size="sm" />
                                                    ) : (
                                                        <Upload className="w-4 h-4 mr-2" />
                                                    )}
                                                    {isUploadingImage ? "Processing..." : "Upload Logo"}
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
                                        <p className="text-xs text-muted-foreground">
                                            Recommended: Square image, 200x200px minimum<br />
                                            Formats: JPG, PNG, WebP (Max 5MB, auto-compressed)
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Interior Image
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    {restaurantInfo.interiorImage ? (
                                        <div className="relative group">
                                            <img
                                                src={restaurantInfo.interiorImage}
                                                alt="Restaurant Interior"
                                                className="w-48 h-32 object-cover rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setRestaurantInfo(prev => ({ ...prev, interiorImage: "" }))}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-48 h-32 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700">
                                            <ImageIcon className="w-12 h-12 text-blue-500" />
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <Label htmlFor="interior-upload" className="cursor-pointer">
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                disabled={isUploadingImage}
                                            >
                                                <span>
                                                    {isUploadingImage ? (
                                                        <InlineLoader size="sm" />
                                                    ) : (
                                                        <Upload className="w-4 h-4 mr-2" />
                                                    )}
                                                    {isUploadingImage ? "Processing..." : "Upload Interior Image"}
                                                </span>
                                            </Button>
                                        </Label>
                                        <Input
                                            id="interior-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'interior')}
                                            className="hidden"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Showcase your restaurant's interior and ambiance<br />
                                            Recommended: 1200x800px, Formats: JPG, PNG, WebP (Max 5MB, auto-compressed)
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                        <ImageIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    Restaurant Gallery
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {restaurantInfo.images.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image}
                                                alt={`Restaurant ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-rose-200 dark:border-rose-800 shadow-md"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Label htmlFor="gallery-upload" className="cursor-pointer">
                                        <div className="w-full h-32 border-2 border-dashed border-rose-300 dark:border-rose-700 rounded-lg flex flex-col items-center justify-center hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/10 dark:to-rose-900/5">
                                            <Upload className="w-8 h-8 text-rose-500 mb-2" />
                                            <span className="text-sm text-rose-600 dark:text-rose-400 font-medium">Add Photo</span>
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
                                <p className="text-xs text-muted-foreground text-center">
                                    Upload high-quality images of your restaurant, food, and ambiance. Recommended: 1200x800px minimum (auto-compressed)
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-6">
                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                        <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    Cuisine Types
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex flex-wrap gap-3">
                                    {restaurantInfo.cuisine.map((cuisine) => (
                                        <Badge
                                            key={cuisine}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors px-3 py-1 text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                            onClick={() => removeCuisine(cuisine)}
                                        >
                                            {cuisine} ×
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <Input
                                        value={newCuisine}
                                        onChange={(e) => setNewCuisine(e.target.value)}
                                        placeholder="Add cuisine type (e.g., Italian, Chinese)"
                                        onKeyPress={(e) => e.key === 'Enter' && addCuisine()}
                                        className="flex-1 h-11 border-2 focus:border-amber-500 transition-colors"
                                    />
                                    <Button
                                        onClick={addCuisine}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-6"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                        <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    Restaurant Features
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex flex-wrap gap-3">
                                    {restaurantInfo.features.map((feature) => (
                                        <Badge
                                            key={feature}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors px-3 py-1 text-sm border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
                                            onClick={() => removeFeature(feature)}
                                        >
                                            {feature} ×
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Add feature (e.g., WiFi, Parking, Live Music)"
                                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                        className="flex-1 h-11 border-2 focus:border-indigo-500 transition-colors"
                                    />
                                    <Button
                                        onClick={addFeature}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                                        <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    Rating & Reviews
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="rating" className="text-sm font-medium flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            Average Rating
                                        </Label>
                                        <Input
                                            id="rating"
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={restaurantInfo.rating}
                                            onChange={(e) => setRestaurantInfo(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                            className="h-11 border-2 focus:border-yellow-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="totalReviews" className="text-sm font-medium">Total Reviews</Label>
                                        <Input
                                            id="totalReviews"
                                            type="number"
                                            min="0"
                                            value={restaurantInfo.totalReviews}
                                            onChange={(e) => setRestaurantInfo(prev => ({ ...prev, totalReviews: parseInt(e.target.value) }))}
                                            className="h-11 border-2 focus:border-yellow-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-medium">
                                            Current Rating: {restaurantInfo.rating}/5.0 ({restaurantInfo.totalReviews} reviews)
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}