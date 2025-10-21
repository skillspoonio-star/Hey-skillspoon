const mongoose = require('mongoose');

const DeliveryAddressSchema = new mongoose.Schema({
  address1: { type: String },
  address2: { type: String },
  landmark: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  fullAddress: { type: String },
}, { _id: false });


const DeliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  address: { type: DeliveryAddressSchema, required: true },
  eta: { type: Number },
  slot: { type: String, enum: ['ASAP','30min','60min','schedule'], default: 'ASAP' },
  scheduledTime: { type: Date, default: null },
  contactless: { type: Boolean, default: false },
  instructions: { type: String, default: '' },
  status: { type: String, enum: ['pending','assigned','out-for-delivery','delivered','cancelled'], default: 'pending' },
}, { timestamps: true });

const Delivery = mongoose.model('Delivery', DeliverySchema);
module.exports = Delivery;
