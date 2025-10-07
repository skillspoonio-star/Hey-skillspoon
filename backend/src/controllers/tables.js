const Table = require('../models/table');

async function listTables(req, res) {
    try {
        const tables = await Table.find({}).sort({ number: 1 }).lean();
        return res.json(tables);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function getTable(req, res) {
    try {
        const t = await Table.findById(req.params.id).lean();
        if (!t) return res.status(404).json({ error: 'Table not found' });
        return res.json(t);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function createTable(req, res) {
    try {
        const body = req.body;
        const num = Number(body.number);
        if (!Number.isFinite(num)) return res.status(400).json({ error: 'number is required and must be numeric' });

        // check uniqueness
        const exists = await Table.findOne({ number: num });
        if (exists) return res.status(409).json({ error: 'Table number already exists' });

        const t = new Table({ number: num, capacity: body.capacity || 4, status: body.status || 'available' });
        await t.save();
        return res.status(201).json(t);
    } catch (err) {
        console.error(err);
        // handle duplicate index in case of race condition
        if (err && err.code === 11000) return res.status(409).json({ error: 'Table number already exists' });
        return res.status(500).json({ error: 'Server error' });
    }
}

async function updateTable(req, res) {
    try {
        const number = Number(req.params.id);
        const allowed = ['number', 'capacity', 'status', 'customerName', 'guestCount', 'sessionTime', 'orderCount', 'amount', 'sessionId', 'lastCleaned', 'nextMaintenance'];
        const toSet = {};
        for (const k of Object.keys(req.body)) if (allowed.includes(k)) toSet[k] = req.body[k];
        if (Object.keys(toSet).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
        const updated = await Table.findOneAndUpdate({number}, { $set: toSet }, { new: true }).lean();
        if (!updated) return res.status(404).json({ error: 'Table not found' });
        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function deleteTable(req, res) {
    try {
        const id = req.params.id;
        const removed = await Table.findByIdAndDelete(id).lean();
        if (!removed) return res.status(404).json({ error: 'Table not found' });
        return res.json({ deleted: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Activities: add an activity to a table
async function addActivity(req, res) {
    try {
        const number = Number(req.params.id);
        const body = req.body;
        const table = await Table.findOne({number});
        if (!table) return res.status(404).json({ error: 'Table not found' });
        const activity = { type: body.type || 'generic', status: body.status || 'pending', assignedTo: body.assignedTo || null, startTime: body.startTime || new Date(), notes: body.notes || null, estimatedDuration: body.estimatedDuration || null };
        table.activities.push(activity);
        await table.save();
        return res.status(201).json(table);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

module.exports = { listTables, getTable, createTable, updateTable, deleteTable, addActivity };
