const Restaurant = require('../models/restaurant');

// Get restaurant information
async function getRestaurantInfo(req, res) {
  try {
    let restaurant = await Restaurant.findOne();
    
    if (!restaurant) {
      // Create default restaurant info if none exists
      restaurant = new Restaurant({
        name: "Spice Garden Restaurant",
        description: "Experience authentic Indian flavors in a warm, welcoming atmosphere. Our chefs use traditional recipes passed down through generations, combined with the finest ingredients to create memorable dining experiences.",
        address: "123 Food Street, Sector 18, Noida, UP 201301",
        phone: "+91 98765 43210",
        email: "info@spicegarden.com",
        website: "www.spicegarden.com",
        openingHours: {
          monday: { open: "11:00", close: "23:00", closed: false },
          tuesday: { open: "11:00", close: "23:00", closed: false },
          wednesday: { open: "11:00", close: "23:00", closed: false },
          thursday: { open: "11:00", close: "23:00", closed: false },
          friday: { open: "11:00", close: "23:00", closed: false },
          saturday: { open: "11:00", close: "23:00", closed: false },
          sunday: { open: "11:00", close: "23:00", closed: false }
        },
        cuisine: ["Indian", "North Indian", "Biryani", "Vegetarian"],
        priceRange: "$$",
        rating: 4.5,
        totalReviews: 1250,
        images: [],
        logo: "",
        interiorImage: "",
        isOpen: true,
        features: ["Dine-in", "Takeaway", "Home Delivery", "Voice Ordering", "Online Payment"]
      });
      await restaurant.save();
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant info:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant information' });
  }
}

// Update restaurant information
async function updateRestaurantInfo(req, res) {
  try {
    const updateData = req.body;
    
    let restaurant = await Restaurant.findOne();
    
    if (!restaurant) {
      restaurant = new Restaurant(updateData);
    } else {
      Object.assign(restaurant, updateData);
    }
    
    await restaurant.save();
    res.json({ message: 'Restaurant information updated successfully', restaurant });
  } catch (error) {
    console.error('Error updating restaurant info:', error);
    res.status(500).json({ error: 'Failed to update restaurant information' });
  }
}

// Upload restaurant images (placeholder - in production, use proper file upload service)
async function uploadImage(req, res) {
  try {
    // This is a placeholder implementation
    // In production, you would use services like AWS S3, Cloudinary, etc.
    const { imageData, type } = req.body;
    
    // For now, just return the base64 data
    // In production, upload to cloud storage and return URL
    res.json({ 
      success: true, 
      imageUrl: imageData,
      message: 'Image uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

module.exports = {
  getRestaurantInfo,
  updateRestaurantInfo,
  uploadImage
};