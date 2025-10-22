const MenuItem = require('../models/menuItem');

async function listItems(req, res) {
  try {
    // By default only list currently available items. Pass ?all=true to list everything.
    const showAll = req.query && String(req.query.all) === 'true'
    const q = showAll ? {} : { isAvailable: true }
    const items = await MenuItem.find(q).sort({ id: 1 }).lean();
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function addItem(req, res) {
  const data = req.body;
  if (!data || typeof data.id === 'undefined' || !data.name || typeof data.price === 'undefined') {
    return res.status(400).json({ error: 'id, name and price are required' });
  }

  try {
    const exists = await MenuItem.findOne({ id: data.id });
    if (exists) return res.status(409).json({ error: 'Item with this id already exists' });

    const item = new MenuItem(data);
    await item.save();
    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function deleteItem(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const del = await MenuItem.findOneAndDelete({ id });
    if (!del) return res.status(404).json({ error: 'Item not found' });
    return res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateItem(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const data = req.body;
  if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: 'No update data provided' });

  try {
    // Whitelist allowed fields to update
    const allowed = [
      'name',
      'description',
      'price',
      'image',
      'category',
      'prepTime',
      'rating',
      'isVeg',
      'isPopular',
      'isAvailable',
      'allergens',
      'calories',
    ];

    const toSet = {};
    for (const key of Object.keys(data)) {
      if (allowed.includes(key)) {
        toSet[key] = data[key];
      }
    }

    if (Object.keys(toSet).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    const updated = await MenuItem.findOneAndUpdate({ id }, { $set: toSet }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listItems, addItem, deleteItem, updateItem };
