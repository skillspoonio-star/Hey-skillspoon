const mongoose = require('mongoose');
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');

function parseRange(range) {
  const now = new Date();
  if (!range || range === '24h' || range === 'today') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  if (range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // fallback: 24h
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

async function overview(req, res) {
  try {
    const range = String(req.query.range || '24h');
    const start = parseRange(range);

    // Basic metrics
    const baseMatch = { timestamp: { $gte: start } };

    const [revRes, countRes, uniqueCustomersRes, statusRes, paymentRes, hourlyRes, popularRes] = await Promise.all([
      // total revenue and avg
      Order.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, totalRevenue: { $sum: '$total' }, avgOrder: { $avg: '$total' }, totalOrders: { $sum: 1 } } },
      ]),
      // count orders
      Order.aggregate([{ $match: baseMatch }, { $count: 'count' }]),
      // unique customers count
      Order.aggregate([
        { $match: { ...baseMatch, customerPhone: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$customerPhone' } },
        { $count: 'uniqueCustomers' },
      ]),
      // status counts
      Order.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // payment method distribution
      Order.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
      ]),
      // hourly aggregation for last 24 hours (return 24 buckets)
      Order.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // popular items
      Order.aggregate([
        { $match: baseMatch },
        { $unwind: '$items' },
        { $group: { _id: '$items.itemId', quantity: { $sum: '$items.quantity' } } },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const rev = revRes && revRes.length ? revRes[0] : { totalRevenue: 0, avgOrder: 0, totalOrders: 0 };
    const totalOrders = countRes && countRes.length ? countRes[0].count : rev.totalOrders || 0;
    const uniqueCustomers = uniqueCustomersRes && uniqueCustomersRes.length ? uniqueCustomersRes[0].uniqueCustomers : 0;

    // map status
    const statusCounts = {};
    for (const s of (statusRes || [])) statusCounts[s._id || 'unknown'] = s.count;

    const paymentMethods = {};
    for (const p of (paymentRes || [])) paymentMethods[p._id || 'unknown'] = p.count;

    // build 24-hour buckets (labels)
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const h = (i + 24) % 24;
      hours.push({ hour: `${h}:00`, revenue: 0, orders: 0 });
    }
    for (const h of (hourlyRes || [])) {
      const idx = Number(h._id);
      if (Number.isFinite(idx) && idx >= 0 && idx < 24) {
        hours[idx].revenue = h.revenue || 0;
        hours[idx].orders = h.orders || 0;
      }
    }

    // resolve popular item names
    const popular = [];
    if (popularRes && popularRes.length) {
      const ids = popularRes.map((r) => r._id);
      const menu = await MenuItem.find({ id: { $in: ids } }).lean();
      const menuById = new Map(menu.map((m) => [m.id, m]));
      for (const r of popularRes) {
        const m = menuById.get(r._id);
        popular.push({ itemId: r._id, name: m ? m.name : `item-${r._id}`, quantity: r.quantity, price: m ? m.price : 0 });
      }
    }

    return res.json({
      totalRevenue: rev.totalRevenue || 0,
      avgOrder: rev.avgOrder || 0,
      totalOrders: totalOrders || 0,
      uniqueCustomers: uniqueCustomers || 0,
      statusCounts,
      paymentMethods,
      hourly: hours,
      popular,
      range: range,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { overview };
