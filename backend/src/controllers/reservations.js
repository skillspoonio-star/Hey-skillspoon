const Reservation = require('../models/reservation');
const Table = require('../models/table');

function validateReservationPayload(data) {
  if (!data) return 'Missing body';
  if (!data.customerName) return 'customerName is required';
  if (!data.date) return 'date is required';
  if (!data.time) return 'time is required';
  if (!data.guests || Number(data.guests) < 1) return 'guests must be >= 1';
  return null;
}

function parseReservationDateTime(dateStr, timeStr) {
  // expect dateStr YYYY-MM-DD and timeStr HH:mm
  return new Date(`${dateStr}T${timeStr}`);
}

function hhmm(date) {
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return pad(date.getHours()) + ':' + pad(date.getMinutes());
}

async function listReservations(req, res) {
  try {
    const reservations = await Reservation.find({}).sort({ reservationTime: 1 }).lean();
    return res.json(reservations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getReservation(req, res) {
  try {
    const r = await Reservation.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ error: 'Reservation not found' });
    return res.json(r);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createReservation(req, res) {
  const data = req.body;
  const err = validateReservationPayload(data);
  if (err) return res.status(400).json({ error: err });

  try {
    const reservationTime = parseReservationDateTime(data.date, data.time);
    const sessionMinutes = data.sessionMinutes ? Number(data.sessionMinutes) : 60;

    // conflict check for table if specified, else we just create reservation
    if (data.tableNumber) {
      const start = reservationTime;
      const end = new Date(reservationTime.getTime() + sessionMinutes * 60 * 1000);
      const startStr = hhmm(start);
      const endStr = hhmm(end);

      // Simple same-date window check. This assumes reservations stored with local date string YYYY-MM-DD
      // If the end crosses to next day this simple check will not detect cross-day collisions.
      const conflict = await Reservation.findOne({
        tableNumber: data.tableNumber,
        date: data.date,
        time: { $gte: startStr, $lte: endStr },
      });
      if (conflict) return res.status(409).json({ error: 'Table already reserved at this time' });
    }

    const created = new Reservation({
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      date: data.date,
      time: data.time,
      guests: data.guests,
      tableNumber: data.tableNumber,
      specialRequests: data.specialRequests,
      occasion: data.occasion,
      sessionMinutes: sessionMinutes,
      notes: data.notes,
      status: data.status || 'pending',
      sessionId: data.sessionId || undefined,
    });

    await created.save();

    // If tableNumber provided, mark table reserved and attach sessionId
    if (data.tableNumber) {
      const sessionId = created._id.toString();
      await Table.findOneAndUpdate({ number: data.tableNumber }, { $set: { status: 'reserved', customerName: data.customerName, guestCount: data.guests, sessionTime: `${data.time}`, sessionId } }, { upsert: false });
      created.sessionId = sessionId;
      await created.save();
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateReservation(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;
    const allowed = ['customerName','phone','email','date','time','guests','tableNumber','status','specialRequests','occasion','sessionMinutes','notes','sessionId'];
    const toSet = {};
    for (const k of Object.keys(data)) {
      if (allowed.includes(k)) toSet[k] = data[k];
    }
    if (Object.keys(toSet).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const updated = await Reservation.findByIdAndUpdate(id, { $set: toSet }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Reservation not found' });

    // If tableNumber or status changed, reflect on Table model
    if (toSet.tableNumber || toSet.status) {
      const tableNumber = toSet.tableNumber || updated.tableNumber;
      if (tableNumber) {
        const tableUpdate = {};
        if (toSet.status === 'cancelled' || toSet.status === 'completed' || toSet.status === 'no-show') {
          tableUpdate.status = 'available';
          tableUpdate.sessionId = null;
          tableUpdate.customerName = null;
          tableUpdate.guestCount = null;
        } else if (toSet.status === 'seated' || updated.status === 'seated') {
          tableUpdate.status = 'occupied';
          tableUpdate.customerName = updated.customerName;
          tableUpdate.guestCount = updated.guests;
          tableUpdate.sessionId = updated.sessionId || updated._id.toString();
        } else if (toSet.status === 'confirmed') {
          tableUpdate.status = 'reserved';
          tableUpdate.customerName = updated.customerName;
          tableUpdate.guestCount = updated.guests;
          tableUpdate.sessionId = updated.sessionId || updated._id.toString();
        }
        await Table.findOneAndUpdate({ number: tableNumber }, { $set: tableUpdate }, { upsert: false });
      }
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function deleteReservation(req, res) {
  try {
    const id = req.params.id;
    const removed = await Reservation.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ error: 'Reservation not found' });

    // clear table session if any
    if (removed.tableNumber && removed.sessionId) {
      await Table.findOneAndUpdate({ number: removed.tableNumber, sessionId: removed.sessionId }, { $set: { status: 'available', sessionId: null, customerName: null, guestCount: null } });
    }

    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listReservations, getReservation, createReservation, updateReservation, deleteReservation };
