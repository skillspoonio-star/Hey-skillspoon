const mongoose = require('mongoose');
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');

function validateCreatePayload(data) {
  if (!data) return 'Missing body';
  if (!Array.isArray(data.items) || data.items.length === 0) return 'items required';
  // Each item should be { itemId: number, quantity: number }
  for (const it of data.items) {
    if (typeof it.itemId === 'undefined' || typeof it.quantity === 'undefined') return 'each item must have itemId and quantity';
    if (Number.isNaN(Number(it.itemId)) || Number.isNaN(Number(it.quantity)) || Number(it.quantity) < 1) return 'invalid itemId or quantity';
  }
  if (typeof data.total === 'undefined') return 'total is required';
  if (!data.orderType) return 'orderType is required';
  if (data.orderType === 'dine-in' && (typeof data.tableNumber === 'undefined' || data.tableNumber === null)) {
    return 'tableNumber is required for dine-in orders';
  }
  if (!['pending','preparing','ready','served','cancelled'].includes(data.status || 'pending')) return 'invalid status';
  return null;
}

async function listOrders(req, res) {
  try {
    const orders = await Order.find({}).sort({ timestamp: -1 }).lean();

    // expand items
    const allItemIds = new Set();
    for (const o of orders) {
      for (const it of o.items || []) allItemIds.add(it.itemId);
    }

    const menuItems = await MenuItem.find({ id: { $in: Array.from(allItemIds) } }).lean();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    const expanded = orders.map((o) => ({
      ...o,
      items: (o.items || []).map((it) => {
        const m = menuById.get(it.itemId);
        return {
          name: m ? m.name : `item-${it.itemId}`,
          quantity: it.quantity,
          price: m ? m.price : 0,
        };
      }),
    }));

    return res.json(expanded);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getOrder(req, res) {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // expand items
    const itemIds = (order.items || []).map((it) => it.itemId);
    const menuItems = await MenuItem.find({ id: { $in: itemIds } }).lean();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    order.items = (order.items || []).map((it) => {
      const m = menuById.get(it.itemId);
      return { name: m ? m.name : `item-${it.itemId}`, quantity: it.quantity, price: m ? m.price : 0 };
    });

    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function listLiveOrders(req, res) {
  try {
    // show live orders that are not completed (served) or cancelled
    const orders = await Order.find({ status: { $nin: ['served', 'cancelled'] } }).sort({ timestamp: -1 }).lean();

    const allItemIds = new Set();
    for (const o of orders) {
      for (const it of o.items || []) allItemIds.add(it.itemId);
    }

    const menuItems = await MenuItem.find({ id: { $in: Array.from(allItemIds) } }).lean();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    const expanded = orders.map((o) => ({
      ...o,
      items: (o.items || []).map((it) => {
        const m = menuById.get(it.itemId);
        return {
          name: m ? m.name : `item-${it.itemId}`,
          quantity: it.quantity,
          price: m ? m.price : 0,
        };
      }),
    }));

    return res.json(expanded);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createOrder(req, res) {
    console.log('Creating order: hereeee');
  const data = req.body;
  const errMsg = validateCreatePayload(data);
  if (errMsg) return res.status(400).json({ error: errMsg });

  try {
    // no client-provided numeric id; Mongo will create _id
    // compute total from MenuItem prices
    const itemIds = data.items.map((i) => i.itemId);
    const menuItems = await MenuItem.find({ id: { $in: itemIds } }).lean();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    let calcTotal = 0;
    for (const it of data.items) {
      const mi = menuById.get(it.itemId);
      const price = mi ? Number(mi.price) : 0;
      calcTotal += price * Number(it.quantity);
    }

    if (Number(calcTotal) !== Number(data.total)) {
      return res.status(400).json({ error: 'total price is changed', calculatedTotal: calcTotal });
    }


    const order = new Order({
      tableNumber: data.tableNumber || null,
      items: data.items,
      total: calcTotal,
      status: data.status || 'pending',
      timestamp: data.timestamp ? new Date(data.timestamp) : Date.now(),
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      estimatedTime: data.estimatedTime || 45,
      priority: data.priority || 'medium',
      paymentStatus: data.paymentStatus || 'unpaid',
      orderType: data.orderType,
    });
    await order.save();
    return res.status(201).json({
        orderId: order._id,
        messgae: 'Order created',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateOrder(req, res) {
  const id = req.params.id;
  // Accept either a Mongo ObjectId (preferred) or a legacy numeric/string `id` field
  const isObjectId = mongoose.Types.ObjectId.isValid(id);

  const data = req.body;
  if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: 'No update data provided' });

  try {
    const allowed = [
      'tableNumber',
      'items',
      'total',
      'status',
      'timestamp',
      'customerPhone',
      'customerName',
      'estimatedTime',
      'priority',
      'paymentStatus',
      'orderType',
    ];

    const toSet = {};
    for (const key of Object.keys(data)) {
      if (allowed.includes(key)) {
        // if items provided, validate shape
        if (key === 'items') {
          const items = data.items;
          if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
          for (const it of items) {
            if (typeof it.itemId === 'undefined' || typeof it.quantity === 'undefined') return res.status(400).json({ error: 'each item must have itemId and quantity' });
            if (Number.isNaN(Number(it.itemId)) || Number.isNaN(Number(it.quantity)) || Number(it.quantity) < 1) return res.status(400).json({ error: 'invalid itemId or quantity' });
          }
          toSet[key] = items;
        } else {
          toSet[key] = data[key];
        }
      }
    }

    if (Object.keys(toSet).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    // If items provided, compute total and compare if client sent `total`
    if (toSet.items) {
      const itemIds = toSet.items.map((i) => i.itemId);
      const menuItems = await MenuItem.find({ id: { $in: itemIds } }).lean();
      const menuById = new Map(menuItems.map((m) => [m.id, m]));
      let calcTotal = 0;
      for (const it of toSet.items) {
        const mi = menuById.get(it.itemId);
        const price = mi ? Number(mi.price) : 0;
        calcTotal += price * Number(it.quantity);
      }
      // if client provided a `total` in request, verify it matches
      if (typeof toSet.total !== 'undefined' && Number(toSet.total) !== Number(calcTotal)) {
        return res.status(400).json({ error: 'total price is changed', calculatedTotal: calcTotal });
      }
      // always set the server-calculated total
      toSet.total = calcTotal;
    }

    // If switching to dine-in ensure tableNumber exists (either provided or already present)
    // Use a lookup query that supports both _id and legacy id fields
    const lookupQuery = isObjectId ? { _id: id } : { $or: [{ id: id }, { id: Number(id) }, { _id: id }] };

    if (toSet.orderType === 'dine-in' && typeof toSet.tableNumber === 'undefined') {
      const existing = await Order.findOne(lookupQuery).lean();
      if (!existing) return res.status(404).json({ error: 'Order not found' });
      if (typeof existing.tableNumber === 'undefined' && typeof toSet.tableNumber === 'undefined') {
        return res.status(400).json({ error: 'tableNumber is required for dine-in orders' });
      }
    }

    const updated = await Order.findOneAndUpdate(lookupQuery, { $set: toSet }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listOrders, getOrder, listLiveOrders, createOrder, updateOrder };
