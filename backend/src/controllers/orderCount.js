const Order = require('../models/order');

async function getTotalCount(req, res) {
  try {
    const total = await Order.countDocuments({});
    return res.json({ totalOrderCount: total });
  } catch (err) {
    console.error('Failed to get total order count', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getTakeawayCount(req, res) {
  try {
    // handle both 'take-away' and 'takeaway' variants just in case
    const count = await Order.countDocuments({ orderType: { $in: ['take-away', 'takeaway'] } });
    return res.json({ count });
  } catch (err) {
    console.error('Failed to get takeaway order count', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getDeliveryCount(req, res) {
  try {
    const count = await Order.countDocuments({ orderType: 'delivery' });
    return res.json({ count });
  } catch (err) {
    console.error('Failed to get delivery order count', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getTotalCount, getTakeawayCount, getDeliveryCount };
