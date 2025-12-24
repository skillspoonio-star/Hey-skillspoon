const Restaurant = require('../models/restaurant');
const mongoose = require('mongoose');

// Get restaurant information
async function getRestaurantInfo(req, res) {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    let restaurant = await Restaurant.findOne();
    
    if (!restaurant) {
      // Return empty restaurant info instead of creating default
      return res.status(404).json({ 
        error: 'Restaurant information not found',
        message: 'Please configure restaurant information in settings'
      });
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
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

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