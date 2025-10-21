const Table = require('../models/table');
const Reservation = require('../models/reservation');

// Simple in-memory SSE clients list (dev only). For multi-instance deployments, use Redis pub/sub.
const sseClients = new Set();

function broadcastTablesUpdate(payload) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of sseClients) {
        try {
            res.write(data);
        } catch (err) {
            // ignore write errors; client may be gone
            sseClients.delete(res);
        }
    }
}

async function listTables(req, res) {
    try {
        const tables = await Table.find({}).sort({ number: 1 }).lean();
        return res.json(tables);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// SSE stream for real-time table updates
async function streamTables(req, res) {
    // set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    // send initial comment
    res.write(': connected\n\n');

    sseClients.add(res);

    // When client closes connection, remove it
    req.on('close', () => {
        sseClients.delete(res);
    });
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
        const reservationPrice = typeof body.reservationPrice !== 'undefined' ? Number(body.reservationPrice) : undefined;
        if (!Number.isFinite(reservationPrice)) return res.status(400).json({ error: 'reservationPrice is required and must be numeric' });

        // check uniqueness
        const exists = await Table.findOne({ number: num });
        if (exists) return res.status(409).json({ error: 'Table number already exists' });

        const t = new Table({ number: num, capacity: body.capacity || 4, section: body.section || "main", status: body.status || 'available', reservationPrice: reservationPrice });
        await t.save();
        // broadcast updated table list
        try {
            const all = await Table.find({}).sort({ number: 1 }).lean();
            broadcastTablesUpdate({ type: 'tables:created', table: t, tables: all });
        } catch (e) { }
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
        const allowed = ['number', 'capacity', 'status', 'section', 'customerName', 'guestCount', 'sessionTime', 'reservationPrice', 'sessionId', 'lastCleaned', 'nextMaintenance', 'orderIds'];
        const toSet = {};
        for (const k of Object.keys(req.body)) if (allowed.includes(k)) toSet[k] = req.body[k];
        if (Object.keys(toSet).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
        const updated = await Table.findOneAndUpdate({ number }, { $set: toSet }, { new: true }).lean();
        if (!updated) return res.status(404).json({ error: 'Table not found' });
        // broadcast update
        try {
            const all = await Table.find({}).sort({ number: 1 }).lean();
            broadcastTablesUpdate({ type: 'tables:updated', table: updated, tables: all });
        } catch (e) { }
        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function deleteTable(req, res) {
    try {
        const idParam = req.params.id;
        let removed = null;
        // if idParam looks like a 24-char hex string, treat as _id
        if (/^[0-9a-fA-F]{24}$/.test(String(idParam))) {
            removed = await Table.findByIdAndDelete(idParam).lean();
        } else if (!Number.isNaN(Number(idParam))) {
            const num = Number(idParam);
            removed = await Table.findOneAndDelete({ number: num }).lean();
        } else {
            return res.status(400).json({ error: 'Invalid table identifier' });
        }

        if (!removed) return res.status(404).json({ error: 'Table not found' });
        try {
            const all = await Table.find({}).sort({ number: 1 }).lean();
            broadcastTablesUpdate({ type: 'tables:deleted', table: removed, tables: all });
        } catch (e) {}
        return res.json({ deleted: true, removed });
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
        const table = await Table.findOne({ number });
        if (!table) return res.status(404).json({ error: 'Table not found' });
        const activity = { type: body.type || 'generic', status: body.status || 'pending', assignedTo: body.assignedTo || null, startTime: body.startTime || new Date(), notes: body.notes || null, estimatedDuration: body.estimatedDuration || null };
        // Prevent overlapping cleaning activities: if adding a cleaning and there is already a cleaning not completed, reject
        if (activity.type === 'cleaning') {
            const hasActiveCleaning = table.activities.some((a) => a.type === 'cleaning' && a.status !== 'completed');
            if (hasActiveCleaning) return res.status(409).json({ error: 'Cleaning already in progress for this table' });
        }
        table.activities.push(activity);
        await table.save();
        try {
            const all = await Table.find({}).sort({ number: 1 }).lean();
            broadcastTablesUpdate({ type: 'tables:activity_added', table: table, tables: all });
        } catch (e) { }
        return res.status(201).json(table);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Return only tables that are considered available now.
// If a table.status === 'available' but there is a reservation for that table
// within the next 60 minutes (status pending|confirmed) it will be treated as unavailable.
async function listAvailableTables(req, res) {
    try {
        function parseDateTimeFromParts(dateStr, timeStr) {
            if (!dateStr || !timeStr) return null;
            const ds = String(dateStr).trim();
            const ts = String(timeStr).trim();

            // normalize date to YYYY-MM-DD
            let year, month, day;
            if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
                [year, month, day] = ds.split('-');
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(ds)) {
                // DD-MM-YYYY
                const parts = ds.split('-');
                day = parts[0];
                month = parts[1];
                year = parts[2];
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ds)) {
                // MM/DD/YYYY
                const parts = ds.split('/');
                month = parts[0].padStart(2, '0');
                day = parts[1].padStart(2, '0');
                year = parts[2];
            } else {
                return null;
            }

            // parse time
            // handle 12-hour with AM/PM
            const m12 = ts.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
            let hh, mm;
            if (m12) {
                hh = Number(m12[1]);
                mm = m12[2];
                const ampm = m12[3].toUpperCase();
                if (ampm === 'PM' && hh < 12) hh = hh + 12;
                if (ampm === 'AM' && hh === 12) hh = 0;
                hh = String(hh).padStart(2, '0');
            } else {
                // try 24-hour HH:mm
                const m24 = ts.match(/^(\d{1,2}):(\d{2})$/);
                if (!m24) return null;
                hh = String(Number(m24[1]).padStart ? Number(m24[1]).padStart(2, '0') : String(m24[1]).padStart(2, '0'));
                mm = m24[2];
            }

            const iso = `${year}-${month}-${day}T${hh}:${mm}`;
            const dt = new Date(iso);
            if (isNaN(dt.getTime())) return null;
            return dt;
        }
        console.log('Parsing date/time for availability check');

        let windowStart = null;
        // Accept date/time from either request body (POST) or query params (GET)
        const reqDate = (req.body && req.body.date) ? req.body.date : (req.query && req.query.date ? req.query.date : null);
        const reqTime = (req.body && req.body.time) ? req.body.time : (req.query && req.query.time ? req.query.time : null);
        if (reqDate && reqTime) {
            const parsed = parseDateTimeFromParts(reqDate, reqTime);
            if (!parsed) return res.status(400).json({ error: 'Invalid date/time' });
            windowStart = parsed;
        } else {
            windowStart = new Date();
        }

        const duration = (req.body && req.body.duration) ? Number(req.body.duration) : (req.query.duration ? Number(req.query.duration) : 60);
        if (!Number.isFinite(duration) || duration <= 0) return res.status(400).json({ error: 'Invalid duration' });

        const windowEnd = new Date(windowStart.getTime() + duration * 60 * 1000);

        let tables;
        if (duration < 60) {
            // short bookings: exclude currently occupied tables
            tables = await Table.find({ status: 'available' }).lean();
        } else {
            // long bookings: ignore current status
            tables = await Table.find({}).lean();
        }
        const numbers = tables.map((t) => t.number);
        if (!numbers.length) return res.json([]);

        // fetch reservations for these tables that could overlap
        // support both old single `tableNumber` and new `tableNumbers` array
        const reservations = await Reservation.find({
            status: { $in: ['pending', 'confirmed', 'seated'] },
            $or: [
                { tableNumber: { $in: numbers } },
                { tableNumbers: { $elemMatch: { $in: numbers } } }
            ]
        }).lean();

        const reservedNumbers = new Set();
        for (const r of reservations) {
            if (!r.date || !r.time) continue;
            const rStart = new Date(`${r.date}T${r.time}`);
            if (isNaN(rStart.getTime())) continue;
            const rDuration = r.sessionMinutes ? Number(r.sessionMinutes) : 60;
            const rEnd = new Date(rStart.getTime() + rDuration * 60 * 1000);

            // overlap if rStart < windowEnd && rEnd > windowStart
            if (rStart < windowEnd && rEnd > windowStart) {
                // support both single tableNumber and multiple tableNumbers
                if (Array.isArray(r.tableNumbers) && r.tableNumbers.length) {
                    for (const tn of r.tableNumbers) reservedNumbers.add(tn);
                } else if (typeof r.tableNumber !== 'undefined' && r.tableNumber !== null) {
                    reservedNumbers.add(r.tableNumber);
                }
            }
        }

        const available = tables
            .filter((t) => !reservedNumbers.has(t.number))
            .map((t) => ({ number: t.number, capacity: t.capacity, reservationPrice: t.reservationPrice || 0 }))
            .sort((a, b) => a.number - b.number);
        console.log('Available tables:', available);
        // also broadcast availability snapshot (optional)
        try {
            broadcastTablesUpdate({ type: 'tables:availability', tables: available });
        } catch (e) { }
        return res.json(available);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

module.exports = { listTables, streamTables, getTable, createTable, updateTable, deleteTable, addActivity, listAvailableTables };
