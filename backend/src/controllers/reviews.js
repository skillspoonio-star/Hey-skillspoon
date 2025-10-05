const Review = require('../models/review');

function formatRelativeDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'a few seconds ago';
  if (diffHour < 1) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffDay < 1) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  // Return date like 10-Sept,25
  const day = date.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month},${year}`;
}

async function listReviews(req, res) {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    const formatted = reviews.map((r) => ({
      name: r.name,
      rating: r.rating,
      date: formatRelativeDate(new Date(r.createdAt)),
      comment: r.comment,
    }));
    return res.json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function addReview(req, res) {
  const { name, rating, comment } = req.body;
  console.log('Adding review:', req.body);
  if (!name || typeof rating === 'undefined' || !comment) {
    return res.status(400).json({ error: 'name, rating and comment are required' });
  }

  try {
    const rev = new Review({ name, rating, comment });
    await rev.save();
    return res.status(201).json({ message: 'Review added' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listReviews, addReview };
