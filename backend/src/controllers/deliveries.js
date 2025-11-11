const mongoose = require('mongoose');
const Order = require('../models/order');
const Delivery = require('../models/delivery');
const MenuItem = require('../models/menuItem');
const { razorpayInstance, validatePaymentVerification } = require('../config/razorpay');
const notify = require('../utils/notify');

function validateDeliveryPayload(data) {
  if (!data) return 'Missing body';
  if (!Array.isArray(data.items) || data.items.length === 0) return 'items required';
  for (const it of data.items) {
    if (typeof it.itemId === 'undefined' || typeof it.quantity === 'undefined') return 'each item must have itemId and quantity';
    if (Number.isNaN(Number(it.itemId)) || Number.isNaN(Number(it.quantity)) || Number(it.quantity) < 1) return 'invalid itemId or quantity';
  }
  if (!data.address || !data.address.address1) return 'address required';
  // totals/payment fields will be stored on the Order; Delivery only needs address and items
  return null;
}

async function createDelivery(req, res) {
  const data = req.body;
  const err = validateDeliveryPayload(data);
  if (err) return res.status(400).json({ error: err });

  try {
    // No payment verification here; handled at order creation or table reservation

    // 1. Validate menu items exist and compute price
    const itemIds = data.items.map((i) => i.itemId);
    const menuItems = await MenuItem.find({ id: { $in: itemIds } }).lean();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    for (const it of data.items) {
      const menu = menuById.get(it.itemId);
      if (!menu) return res.status(400).json({ error: `Menu item not found: ${it.itemId}` });
      subtotal += Number(menu.price) * Number(it.quantity);
    }
    // Calculate tax, discount, delivery fee, tip
    const tax = Math.round(subtotal * 0.18);
    const discount = data.promo === 'FLAT50' ? 50 : (data.promo === 'SAVE10' ? Math.min(100, Math.round(subtotal * 0.1)) : 0);
    const deliveryFee = subtotal > 999 ? 0 : 49;
    const tip = Number(data.tip) || 0;
    const total = Math.max(0, subtotal - discount) + tax + deliveryFee + tip;

    // 3. Create Order with correct totals
    const orderPayload = {
      items: data.items,
      subtotal,
      tax,
      discount,
      extraCharges: deliveryFee,
      total,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      paymentStatus: data.paymentStatus || (data.paymentMethod === 'upi' ? 'paid' : 'unpaid'),
      paymentMethod: data.paymentMethod || 'pending',
      orderType: 'delivery',
      status: 'pending',
      estimatedTime: data.eta || null,
    };

    // assign sequential tableNumber for delivery orders (count-based)
    try {
      const cnt = await Order.countDocuments({ orderType: 'delivery' });
      orderPayload.tableNumber = cnt + 1;
    } catch (cErr) {
      console.error('Failed to compute delivery tableNumber, continuing without it', cErr);
    }

    const order = new Order(orderPayload);
    await order.save();

    const address = data.address;
    const deliveryDoc = new Delivery({
      orderId: order._id,
      address: {
        address1: address.address1,
        address2: address.address2 || '',
        landmark: address.landmark || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        fullAddress: [address.address1, address.address2, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(', '),
      },
      eta: data.eta || null,
      slot: data.slot || 'ASAP',
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      contactless: !!data.contactless,
      instructions: data.instructions || '',
    });

    await deliveryDoc.save();

    await notify.sendEmail(data.customerEmail || '', 'Order Placed', `Your order ${order._id} has been placed.`);
    await notify.sendSMS(data.customerPhone, `Order ${order._id} placed!`);

    return res.status(201).json({ orderId: order._id, deliveryId: deliveryDoc._id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

// List all deliveries
async function listDeliveries(req, res) {
  try {
    const deliveries = await Delivery.find({}).sort({ createdAt: -1 }).populate('orderId').lean();
    return res.json(deliveries);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

// Update delivery
async function updateDelivery(req, res) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const allowed = ['status', 'eta', 'slot', 'scheduledTime', 'contactless', 'instructions'];
    const toSet = {};
    for (const key of Object.keys(req.body || {})) {
      if (allowed.includes(key)) toSet[key] = req.body[key];
    }
    if (Object.keys(toSet).length === 0) return res.status(400).json({ error: 'No updatable fields' });

    // If status update is requested, enforce delivery-specific rules:
    if (typeof toSet.status !== 'undefined') {
      const allowedStatuses = ['out-for-delivery', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(toSet.status)) {
        return res.status(400).json({ error: 'Invalid delivery status update via this endpoint' });
      }

      // Load delivery and linked order to check order state
      const delivery = await Delivery.findById(id).populate('orderId').lean();
      if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
      const order = delivery.orderId;
      if (!order) return res.status(400).json({ error: 'Linked order not found' });

      // Only allow marking out-for-delivery or delivered when linked order is in 'ready' state
      if (['out-for-delivery', 'delivered'].includes(toSet.status)) {
        if (String(order.status) !== 'served') {
          return res.status(409).json({ error: 'Linked order must be in ready state to change delivery status' });
        }
      }

      // perform the update
      const updated = await Delivery.findByIdAndUpdate(id, { $set: toSet }, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Delivery not found' });

      // propagate to order: delivered -> served; cancelled -> cancelled
      if (toSet.status === 'delivered') {
        try {
          await Order.findByIdAndUpdate(order._id, { $set: { status: 'served' } });
          await notify.sendEmail(order.customerEmail || '', 'Order Delivered', `Your order ${order._id} has been delivered.`);
          await notify.sendSMS(order.customerPhone, `Order ${order._id} delivered!`);
        } catch (err) {
          console.warn('Failed to update linked order status to served', err);
        }
      } else if (toSet.status === 'cancelled') {
        try {
          await Order.findByIdAndUpdate(order._id, { $set: { status: 'cancelled' } });
          await notify.sendEmail(order.customerEmail || '', 'Order Cancelled', `Your order ${order._id} was cancelled.`);
          await notify.sendSMS(order.customerPhone, `Order ${order._id} cancelled.`);
        } catch (err) {
          console.warn('Failed to update linked order status to cancelled', err);
        }
      }

      return res.json(updated);
    }

    // Non-status updates - perform normally
    const updated = await Delivery.findByIdAndUpdate(id, { $set: toSet }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Delivery not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Failed to update delivery', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createDelivery, listDeliveries, updateDelivery };

