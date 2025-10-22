const mongoose = require('mongoose');
const crypto = require('crypto');
const Session = require('../models/session');
const Order = require('../models/order');
const Table = require('../models/table');

function generateSessionId() {
  return `S_${crypto.randomBytes(4).toString('hex')}`;
}

async function createSession(req, res) {
  try {
    const { tableNumber, customerName, mobile, payment } = req.body;
    if (typeof tableNumber === 'undefined' || Number.isNaN(Number(tableNumber))) return res.status(400).json({ error: 'tableNumber is required' });
    const table = await Table.findOne({ number: Number(tableNumber) });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    // ensure table is available for new session
    if (table.status && table.status === 'occupied') return res.status(409).json({ error: 'Table is currently occupied' });

    const sessionId = generateSessionId();
    const s = new Session({ sessionId, tableNumber: Number(tableNumber), customerName: customerName || null, mobile: mobile || null, payment: payment || undefined, active: true });
    await s.save();

    // mark table as occupied and attach sessionId
    try {
      await Table.findOneAndUpdate({ number: Number(tableNumber) }, { $set: { status: 'occupied', sessionId: sessionId, customerName: customerName || null } });
    } catch (uerr) {
      console.error('Failed to update table after creating session', uerr);
    }

    return res.status(201).json(s);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getSessionById(req, res) {
  try {
    const id = req.params.id;
    // allow lookup by sessionId or Mongo _id
    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { sessionId: id }] } : { sessionId: id };
    const s = await Session.findOne(query).populate('orders').lean();
    if (!s) return res.status(404).json({ error: 'Session not found' });
    return res.json(s);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getSessionByTable(req, res) {
  try {
    const number = Number(req.params.number);
    if (Number.isNaN(number)) return res.status(400).json({ error: 'Invalid table number' });
    const s = await Session.findOne({ tableNumber: number, active: true }).populate('orders').lean();
    if (!s) return res.status(404).json({ error: 'Active session not found for table' });
    return res.json(s);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function patchSession(req, res) {
  try {
    const id = req.params.id;
    const allowed = ['customerName', 'mobile', 'payment', 'active'];
    const toSet = {};
    for (const k of Object.keys(req.body)) if (allowed.includes(k)) toSet[k] = req.body[k];
    if (Object.keys(toSet).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { sessionId: id }] } : { sessionId: id };
    const updated = await Session.findOneAndUpdate(query, { $set: toSet }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Create an order for this session and attach it atomically to the session
async function addOrderToSession(req, res) {
  try {
    const id = req.params.id; // sessionId or mongo id
    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { sessionId: id }] } : { sessionId: id };
    const session = await Session.findOne(query).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Build order payload using session's customer and tableNumber
    const payload = req.body || {};
    // Ensure items & total provided (order create validation will run in orders controller)
    payload.tableNumber = session.tableNumber;
    payload.customerName = payload.customerName || session.customerName || null;
    payload.customerPhone = payload.customerPhone || session.mobile || null;

    // Reuse Order creation logic by directly constructing and saving a new Order document here
    // (this keeps behavior consistent and avoids circular require of controllers)
    // Validate minimal shape
    if (!Array.isArray(payload.items) || payload.items.length === 0) return res.status(400).json({ error: 'items required' });
    if (typeof payload.total === 'undefined') return res.status(400).json({ error: 'total is required' });
    if (!payload.orderType) payload.orderType = 'dine-in';

    // compute total from MenuItem prices is handled in orders controller; for now, trust client but ensure basic shape
    const order = new Order({
      tableNumber: session.tableNumber,
      items: payload.items,
      total: payload.total,
      subtotal: payload.subtotal || payload.total,
      tax: payload.tax || 0,
      discount: payload.discount || 0,
      status: payload.status || 'pending',
      timestamp: payload.timestamp ? new Date(payload.timestamp) : Date.now(),
      customerPhone: payload.customerPhone,
      customerName: payload.customerName,
      estimatedTime: payload.estimatedTime || 45,
      specialRequests: payload.specialRequests || null,
      priority: payload.priority || 'medium',
      paymentStatus: payload.paymentStatus || 'unpaid',
      paymentMethod: payload.paymentMethod || 'pending',
      orderType: payload.orderType,
    });
    await order.save();

    // Atomically push order id and increment session.payment.total
    const inc = Number(order.total) || 0;
    const updated = await Session.findOneAndUpdate(query, { $push: { orders: order._id }, $inc: { 'payment.total': inc } }, { new: true }).lean();

    // Also attach order id to Table.orderIds for quick reference
    try {
      await Table.findOneAndUpdate({ number: session.tableNumber }, { $push: { orderIds: order._id }, $set: { status: 'occupied', sessionId: session.sessionId } });
    } catch (e) {
      console.error('Failed to update table with order id', e);
    }

    return res.status(201).json({ orderId: order._id, session: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// End a session: mark inactive, optionally set table to cleaning and clear sessionId
async function endSession(req, res) {
  try {
    const id = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { sessionId: id }] } : { sessionId: id };
    const session = await Session.findOneAndUpdate(query, { $set: { active: false } }, { new: true }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    try {
      await Table.findOneAndUpdate({ number: session.tableNumber }, { $set: { sessionId: null, status: 'cleaning' } });
    } catch (e) {
      console.error('Failed to update table after ending session', e);
    }

    return res.json({ ended: true, session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createSession, getSessionById, getSessionByTable, patchSession, addOrderToSession, endSession };
