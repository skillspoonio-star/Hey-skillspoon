const mongoose = require('mongoose');
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');
const Table = require('../models/table');
const Reservation = require('../models/reservation');
const Session = require('../models/session');
const Payment = require('../models/payment');
const crypto = require('crypto');

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

    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Return live counter/dine-in orders (not served or cancelled) with expanded item details
async function getLiveCounterOrders(req, res) {
  try {
    // compute today's date range (local server timezone)
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    // fetch dine-in orders created today
    const orders = await Order.find({ orderType: 'dine-in', timestamp: { $gte: start, $lt: end } }).lean();

    // expand items with menu data
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
          itemId: it.itemId,
          name: m ? m.name : `item-${it.itemId}`,
          quantity: it.quantity,
          price: m ? m.price : 0,
        };
      }),
      // helper fields for sorting
      __isLive: !['served', 'cancelled'].includes(o.status),
      __priorityValue: (o.priority === 'high' ? 3 : o.priority === 'medium' ? 2 : 1),
    }));

    // sort according to rules:
    // - live orders (not served/cancelled) come first
    // - if both live => sort by timestamp (older first)
    // - otherwise sort by priority (high->low), then timestamp (older first)
    expanded.sort((a, b) => {
      if (a.__isLive !== b.__isLive) return a.__isLive ? -1 : 1;
      if (a.__isLive && b.__isLive) {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      // both not live: compare priority, then time
      if (b.__priorityValue !== a.__priorityValue) return b.__priorityValue - a.__priorityValue;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    // remove helper fields before returning
    const cleaned = expanded.map(({ __isLive, __priorityValue, ...rest }) => rest);
    return res.json(cleaned);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createOrder(req, res) {
  const data = req.body;
  const errMsg = validateCreatePayload(data);
  if (errMsg) return res.status(400).json({ error: errMsg });

  try {
    const itemIds = data.items.map((i) => i.itemId);
    const menuItems = await MenuItem.find({ id: { $in: itemIds } }).lean();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    let calcTotal = 0;
    for (const it of data.items) {
      const mi = menuById.get(it.itemId);
      if (mi && mi.isAvailable === false) {
        return res.status(409).json({ error: 'One or more items are unavailable', itemId: it.itemId, itemName: mi.name });
      }
      const price = mi ? Number(mi.price) : 0;
      calcTotal += price * Number(it.quantity);
    }
    calcTotal+= (data.tax || 0 )- (data.discount || 0);

    if (Number(calcTotal) !== Number(data.total)) {
      return res.status(400).json({ error: 'total price is changed', calculatedTotal: calcTotal });
    }

   if (!data.tableNumber) {
      if (data.orderType === 'delivery') {
        const cnt = await Order.countDocuments({ orderType: 'delivery' });
        data.tableNumber = cnt + 1;
      } else if (data.orderType === 'take-away' || data.orderType === 'takeaway') {
        const cnt = await Order.countDocuments({ orderType: { $in: ['take-away', 'takeaway'] } });
        data.tableNumber = cnt + 1;
      }
    }


    // For dine-in orders, ensure there's a session to attach to (reuse active session if present,
    // otherwise create a new session for the customer and table). Also check reservations.
    let sessionToAttach = null;
    if (data.tableNumber && data.orderType === 'dine-in') {
      const table = await Table.findOne({ number: data.tableNumber }).lean();
      if (!table) return res.status(400).json({ error: 'Table not found' });

      // Check for an active session for this table
      const activeSession = await Session.findOne({ tableNumber: Number(data.tableNumber), active: true }).lean();
      if (activeSession) {
        // If customerPhone provided and differs from active session mobile, block
        if (data.customerPhone && activeSession.mobile && String(data.customerPhone) !== String(activeSession.mobile)) {
          return res.status(409).json({ error: 'Table is already occupied by another customer' });
        }
        // attach to existing active session
        sessionToAttach = activeSession;
      } else {
        // No active session: create a new session for this dine-in order
        const newSessionId = `S_${crypto.randomBytes(4).toString('hex')}`;
        const newSession = new Session({ sessionId: newSessionId, tableNumber: Number(data.tableNumber), customerName: data.customerName || null, mobile: data.customerPhone || null, payment: { total: 0 }, active: true });
        await newSession.save();
        // mark table occupied and append session id
        try {
          await Table.findOneAndUpdate({ number: Number(data.tableNumber) }, { $set: { status: 'occupied', customerName: data.customerName || null, guestCount: data.guests || null }, $addToSet: { sessionIds: newSessionId } });
        } catch (uerr) {
          console.error('Failed to update table after creating session from order', uerr);
        }
        sessionToAttach = newSession.toObject ? newSession.toObject() : newSession;
      }

      const orderTime = data.timestamp ? new Date(data.timestamp) : new Date();
      const windowEnd = new Date(orderTime.getTime() + 60 * 60 * 1000); // next 1 hour

      // fetch reservations for this table and check if any fall within [orderTime, windowEnd]
      // support both single tableNumber and multiple tableNumbers
      const reservations = await Reservation.find({ $or: [{ tableNumber: data.tableNumber }, { tableNumbers: data.tableNumber }] }).lean();
      for (const r of reservations) {
        if (!r.date || !r.time) continue;
        const rt = new Date(`${r.date}T${r.time}`);
        if (rt >= orderTime && rt <= windowEnd) {
          return res.status(409).json({ error: 'Table is reserved at this time', reservation: r });
        }
      }
    }

    const order = new Order({
      tableNumber: data.tableNumber || null,
      items: data.items,
      total: data.total,
      subtotal: data.subtotal,
      tax: data.tax || 0,
      discount: data.discount || 0,
      status: data.status || 'pending',
      timestamp: data.timestamp ? new Date(data.timestamp) : Date.now(),
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      estimatedTime: data.estimatedTime || 45,
      specialRequests: data.specialRequests || null,
      priority: data.priority || 'medium',
      paymentStatus: data.paymentStatus || 'unpaid',
      paymentMethod: data.paymentMethod || 'pending',
      orderType: data.orderType,
    });
    await order.save();

    // If order is marked as paid, create a Payment record automatically
    if (data.paymentStatus === 'paid') {
      try {
        const payment = new Payment({
          amount: data.total,
          type: data.paymentMethod || 'cash',
          paymentOf: 'order',
          orderId: order._id,
        });
        await payment.save();
      } catch (paymentErr) {
        console.error('Failed to create Payment record for paid order', paymentErr);
        // Don't fail the order creation if payment creation fails
      }
    }

    // no-op: counters feature removed per request
    // If this is a dine-in order and we have a session to attach, attach the order to that session
    if (data.tableNumber && data.orderType === 'dine-in' && sessionToAttach) {
      try {
        await Session.findOneAndUpdate({ sessionId: sessionToAttach.sessionId }, { $push: { orders: order._id }, $inc: { 'payment.total': Number(order.total) || 0 } });
      } catch (e) {
        console.error('Failed to attach order to session', e);
      }
      try {
        await Table.findOneAndUpdate({ number: data.tableNumber }, { $push: { orderIds: order._id }, $set: { status: 'occupied' }, $addToSet: { sessionIds: sessionToAttach.sessionId } });
      } catch (uerr) {
        console.error('Failed to update table status after order create', uerr);
      }
    }
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
      'paymentMethod',
      'specialRequests',
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

// Return dine-in orders with expanded item details and payment status
async function getDineInOrders(req, res) {
  try {
    // fetch all dine-in orders
    const orders = await Order.find({
      orderType: 'dine-in'
    }).sort({ timestamp: -1 }).lean();

    // expand items with menu data
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

// Get revenue history (aggregated by day with payment status breakdown)
async function getRevenueHistory(req, res) {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all dine-in orders from the past N days
    const orders = await Order.find({
      orderType: 'dine-in',
      timestamp: { $gte: startDate }
    }).lean();

    // Group by day and payment status
    const revenueByDay = {};

    for (const order of orders) {
      const date = new Date(order.timestamp);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!revenueByDay[dateStr]) {
        revenueByDay[dateStr] = {
          date: dateStr,
          totalRevenue: 0,
          paidAmount: 0,
          remainingAmount: 0,
          paidCount: 0,
          unpaidCount: 0,
          cashPayments: 0,
          upiPayments: 0,
          cardPayments: 0
        };
      }

      revenueByDay[dateStr].totalRevenue += order.total;

      if (order.paymentStatus === 'paid') {
        revenueByDay[dateStr].paidAmount += order.total;
        revenueByDay[dateStr].paidCount += 1;
      } else {
        revenueByDay[dateStr].remainingAmount += order.total;
        revenueByDay[dateStr].unpaidCount += 1;
      }

      if (order.paymentMethod === 'cash') {
        revenueByDay[dateStr].cashPayments += 1;
      } else if (order.paymentMethod === 'upi') {
        revenueByDay[dateStr].upiPayments += 1;
      } else if (order.paymentMethod === 'card') {
        revenueByDay[dateStr].cardPayments += 1;
      }
    }

    // Convert to sorted array
    const result = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Get today's payment summary for dine-in orders
async function getTodaysPaymentSummary(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      orderType: 'dine-in',
      timestamp: { $gte: today, $lt: tomorrow }
    }).lean();

    const summary = {
      totalOrders: orders.length,
      totalRevenue: 0,
      paidRevenue: 0,
      remainingRevenue: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      cashPayments: 0,
      upiPayments: 0,
      cardPayments: 0,
      pendingPayments: []
    };

    for (const order of orders) {
      summary.totalRevenue += order.total;

      if (order.paymentStatus === 'paid') {
        summary.paidRevenue += order.total;
        summary.paidOrders += 1;
      } else {
        summary.remainingRevenue += order.total;
        summary.unpaidOrders += 1;
        summary.pendingPayments.push({
          id: order._id,
          tableNumber: order.tableNumber,
          total: order.total,
          paymentMethod: order.paymentMethod || 'pending',
          customerPhone: order.customerPhone || 'N/A',
          timestamp: order.timestamp,
          status: 'pending'
        });
      }

      if (order.paymentMethod === 'cash') {
        summary.cashPayments += 1;
      } else if (order.paymentMethod === 'upi') {
        summary.upiPayments += 1;
      } else if (order.paymentMethod === 'card') {
        summary.cardPayments += 1;
      }
    }

    return res.json(summary);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}



module.exports = { 
  listOrders, 
  getOrder, 
  listLiveOrders, 
  getLiveCounterOrders, 
  createOrder, 
  updateOrder, 
  getTakeAwayOrders,
  getDineInOrders,
  getRevenueHistory,
  getTodaysPaymentSummary,
  confirmSessionPayment
};

// Confirm payment for a session/table: mark session payment paid, create Payment record, and update attached orders
async function confirmSessionPayment(req, res) {
  try {
    const { tableNumber, paymentMethod, amount } = req.body || {}
    if (typeof tableNumber === 'undefined') return res.status(400).json({ error: 'tableNumber required' })

    // find active session for this table
    const session = await Session.findOne({ tableNumber: Number(tableNumber), active: true })
    if (!session) {
      // fallback: mark recent dine-in orders for table as paid
      const cutoff = new Date()
      cutoff.setHours(0,0,0,0)
      const orders = await Order.find({ orderType: 'dine-in', tableNumber: Number(tableNumber), timestamp: { $gte: cutoff } })
      const ids = orders.map(o => o._id)
      if (ids.length > 0) {
        await Order.updateMany({ _id: { $in: ids } }, { $set: { paymentStatus: 'paid', paymentMethod: paymentMethod || 'cash', status: 'served' } })
      }

      // Create a Payment record for this session confirmation
      const totalAmount = typeof amount === 'number' ? amount : orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
      if (totalAmount > 0) {
        try {
          const payment = new Payment({
            amount: totalAmount,
            type: paymentMethod || 'cash',
            paymentOf: 'session',
            sessionId: `table-${tableNumber}`, // fallback session id
          })
          await payment.save()
        } catch (paymentErr) {
          console.error('Failed to create Payment for session confirmation', paymentErr)
        }
      }

      return res.json({ ok: true, updatedOrders: ids.length })
    }

    // update session payment
    session.payment = session.payment || {}
    session.payment.total = typeof amount === 'number' ? amount : session.payment.total || 0
    session.payment.method = paymentMethod || session.payment.method || 'cash'
    session.payment.status = 'paid'
    await session.save()

    // Create a Payment record for this session confirmation
    const paymentAmount = typeof amount === 'number' ? amount : (session.payment.total || 0)
    if (paymentAmount > 0) {
      try {
        const payment = new Payment({
          amount: paymentAmount,
          type: paymentMethod || 'cash',
          paymentOf: 'session',
          sessionId: session.sessionId || session._id,
        })
        await payment.save()
      } catch (paymentErr) {
        console.error('Failed to create Payment for session confirmation', paymentErr)
      }
    }

    // update all orders attached to session
    if (Array.isArray(session.orders) && session.orders.length > 0) {
      await Order.updateMany({ _id: { $in: session.orders } }, { $set: { paymentStatus: 'paid', paymentMethod: paymentMethod || 'cash', status: 'served' } })
    }

    return res.json({ ok: true, sessionId: session.sessionId, updatedOrders: session.orders.length })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
// Return take-away orders with expanded item details
async function getTakeAwayOrders(req, res) {
  try {
    // fetch all take-away orders
    const orders = await Order.find({
      orderType: { $in: ['take-away', 'takeaway', 'take away'] }
    }).sort({ timestamp: -1 }).lean();

    // expand items with menu data
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
