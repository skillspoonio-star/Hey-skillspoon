const authMiddleware = require('../middleware/auth');
const Reservation = require('../models/reservation');
const Table = require('../models/table');
const Payment = require('../models/payment');

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
    // allow lookup by reservationId (like RES6) or by _id
    const lookup = req.params.id;
    let r = null;
    if (/^RES\d+$/i.test(lookup)) {
      r = await Reservation.findOne({ id: lookup }).lean();
    }
    if (!r) r = await Reservation.findById(lookup).lean();
    if (!r) return res.status(404).json({ error: 'Reservation not found' });
    // return with id = reservationId or _id string
    const { __v, _id, ...rest } = r;
    return res.json({ id: r.id || (_id && _id.toString()), ...rest });
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
    // Build a list of tables to check for conflicts. Accept either tableNumbers (array) or tableNumber (single)
    const tablesToCheck = Array.isArray(data.tableNumbers) && data.tableNumbers.length ? data.tableNumbers : (typeof data.tableNumber !== 'undefined' && data.tableNumber !== null ? [data.tableNumber] : []);
    if (tablesToCheck.length) {
      const start = reservationTime;
      const end = new Date(reservationTime.getTime() + sessionMinutes * 60 * 1000);
      const startStr = hhmm(start);
      const endStr = hhmm(end);

      // Find any reservation overlapping on the same date and time window for any of the requested tables
      const conflict = await Reservation.findOne({
        date: data.date,
        time: { $gte: startStr, $lte: endStr },
        $or: [{ tableNumber: { $in: tablesToCheck } }, { tableNumbers: { $elemMatch: { $in: tablesToCheck } } }]
      });
      if (conflict) return res.status(409).json({ error: 'Some tables already reserved at this time', conflict });
    }

    // compute payment server-side: sum reservationPrice of selected tables
    const createdTables = tablesToCheck;
    let subtotal = 0;
    if (Array.isArray(createdTables) && createdTables.length) {
      // fetch tables to compute subtotal
      const tables = await Table.find({ number: { $in: createdTables } }).lean();
      for (const t of tables) {
        subtotal += Number(t.reservationPrice || 0);
      }
    }
    const count = await Reservation.countDocuments();
    const baseId = `RES${count + 1}`;
    let publicId = baseId;
    if (!data.payment) {
      // admin-created reservation: run the existing auth middleware inline and stop if it already responded
      let authed = false;
      await new Promise((resolve) => {
        try {
          authMiddleware(req, res, () => {
            authed = true;
            resolve();
          });
        } catch (err) {
          resolve();
        }
      });
      if (!authed) {
        // authMiddleware has already sent a 401/403 response, so stop processing
        return;
      }

      // create reservation by admin
      // normalize table numbers: accept single tableNumber or array, coerce to numbers and sort
      const normalizedTableNumbers = Array.isArray(data.tableNumbers) ? data.tableNumbers.map(Number).filter((x) => !Number.isNaN(x)) : (typeof data.tableNumber !== 'undefined' && data.tableNumber !== null ? [Number(data.tableNumber)] : []);
      normalizedTableNumbers.sort((a, b) => a - b);

      const created = new Reservation({
        customerName: data.customerName,
        phone: data.phone,
        email: data.email,
        date: data.date,
        time: data.time,
        guests: data.guests,
        tableNumbers: normalizedTableNumbers,
        tableNumber: normalizedTableNumbers && normalizedTableNumbers.length ? normalizedTableNumbers[0] : (typeof data.tableNumber !== 'undefined' && data.tableNumber !== null ? Number(data.tableNumber) : undefined),
        id: publicId,
        specialRequests: data.specialRequests,
        occasion: data.occasion,
        sessionMinutes: sessionMinutes,
        notes: data.notes,
        status: data.status || 'pending',
        sessionId: data.sessionId || undefined,
      });

      await created.save();
      return res.status(201).json(created);
    }

    // Payment path - validate subtotal
    if (subtotal != data.payment?.subtotal) {
      return res.status(400).json({ error: 'Subtotal mismatch' });
    }
      // apply extras coming from client, but validate numeric
      const tax = data.payment?.tax && Number.isFinite(Number(data.payment.tax)) ? Number(data.payment.tax) : 0;
      const discount = data.payment?.discount && Number.isFinite(Number(data.payment.discount)) ? Number(data.payment.discount) : 0;
      const extraCharge = data.payment?.extraCharge && Number.isFinite(Number(data.payment.extraCharge)) ? Number(data.payment.extraCharge) : 0;
      const total = subtotal + tax + extraCharge - discount;


      // create a reservationId: RES<count + 1>
      // compute count quickly (approx) and use it to build reservationId. Use a retry if duplicate.

    // normalize table numbers for payment path as well
    const normalizedTableNumbers2 = Array.isArray(data.tableNumbers) ? data.tableNumbers.map(Number).filter((x) => !Number.isNaN(x)) : (typeof data.tableNumber !== 'undefined' && data.tableNumber !== null ? [Number(data.tableNumber)] : []);
    normalizedTableNumbers2.sort((a, b) => a - b);

    const created = new Reservation({
        customerName: data.customerName,
        phone: data.phone,
        email: data.email,
        date: data.date,
        time: data.time,
        guests: data.guests,
  tableNumbers: normalizedTableNumbers2,
  tableNumber: normalizedTableNumbers2 && normalizedTableNumbers2.length ? normalizedTableNumbers2[0] : (typeof data.tableNumber !== 'undefined' && data.tableNumber !== null ? Number(data.tableNumber) : undefined),
        id: publicId,
        payment: {
          subtotal,
          tax,
          discount,
          extraCharge,
          total,
          currency: data.currency || 'INR',
          paymentStatus: data.payment.paymentStatus || 'pending',
        },
        specialRequests: data.specialRequests,
        occasion: data.occasion,
        sessionMinutes: sessionMinutes,
        notes: data.notes,
        status: data.payment.paymentStatus === 'paid' ? 'paid' : 'pending',
        sessionId: data.sessionId || undefined,
      });

      await created.save();

      // If reservation is marked as paid, create a Payment record automatically
      if (created.payment && created.payment.paymentStatus === 'paid') {
        try {
          const payment = new Payment({
            amount: created.payment.total,
            type: 'upi', // default type for reservations
            paymentOf: 'reservation',
            reservationId: created._id,
          });
          await payment.save();
        } catch (paymentErr) {
          console.error('Failed to create Payment record for paid reservation', paymentErr);
          // Don't fail the reservation creation if payment creation fails
        }
      }

      // If saving failed due to duplicate public id (rare race), retry with a new number
      // Note: Mongoose will throw on duplicate key; however, to keep logic simple, catch and retry once
      // (A more robust approach would use a counter collection or transactions)
      // If created does not have reservationId (due to duplicate), generate a fresh one and update
      if (!created.id) {
        const newCount = await Reservation.countDocuments();
        const newId = `RES${newCount + 1}`;
        created.id = newId;
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
      const idParam = req.params.id;
      // allow reservationId or _id
      let id = idParam;
      if (/^RES\d+$/i.test(idParam)) {
        const found = await Reservation.findOne({ id: idParam }).lean();
        if (!found) return res.status(404).json({ error: 'Reservation not found' });
        id = found._id.toString();
      }
  const data = req.body;
      const allowed = ['customerName', 'phone', 'email', 'date', 'time', 'guests', 'tableNumber', 'tableNumbers', 'status', 'specialRequests', 'occasion', 'sessionMinutes', 'notes', 'sessionId', 'payment'];
      const toSet = {};
      for (const k of Object.keys(data)) {
        if (allowed.includes(k)) toSet[k] = data[k];
      }
      if (Object.keys(toSet).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

      // if updating tableNumbers or tableNumber, normalize and sort before applying
      if (toSet.tableNumbers) {
        const nums = Array.isArray(toSet.tableNumbers) ? toSet.tableNumbers.map(Number).filter((x) => !Number.isNaN(x)) : [];
        nums.sort((a, b) => a - b);
        toSet.tableNumbers = nums;
        if (!toSet.tableNumber && nums.length) toSet.tableNumber = nums[0];
      }
      if (toSet.tableNumber && !toSet.tableNumbers) {
        const n = Number(toSet.tableNumber);
        if (!Number.isNaN(n)) toSet.tableNumbers = [n];
      }

      const updated = await Reservation.findByIdAndUpdate(id, { $set: toSet }, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Reservation not found' });

      // If tableNumber or status changed, reflect on Table model
      // If tableNumbers/tableNumber or status changed, reflect on Table model
      if ((toSet.tableNumbers && toSet.tableNumbers.length) || toSet.tableNumber || toSet.status) {
        const finalTables = (toSet.tableNumbers && toSet.tableNumbers.length) ? toSet.tableNumbers : (toSet.tableNumber ? [toSet.tableNumber] : (updated.tableNumbers && updated.tableNumbers.length ? updated.tableNumbers : (updated.tableNumber ? [updated.tableNumber] : [])));
        if (finalTables && finalTables.length) {
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
          // update all affected tables
          for (const tn of finalTables) {
            await Table.findOneAndUpdate({ number: tn }, { $set: tableUpdate }, { upsert: false });
          }
        }
      }

      // return with id field as public id (if present)
      const { __v, _id, ...rest } = updated;
      return res.json({ id: updated.id || (_id && _id.toString()), ...rest });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async function deleteReservation(req, res) {
    try {
      const idParam = req.params.id;
      let id = idParam;
      if (/^RES\d+$/i.test(idParam)) {
        const found = await Reservation.findOne({ id: idParam }).lean();
        if (!found) return res.status(404).json({ error: 'Reservation not found' });
        id = found._id.toString();
      }
      const removed = await Reservation.findByIdAndDelete(id).lean();
      if (!removed) return res.status(404).json({ error: 'Reservation not found' });

      // clear table session if any
      // clear table sessions for all associated tables
      const removedTables = Array.isArray(removed.tableNumbers) && removed.tableNumbers.length ? removed.tableNumbers : (removed.tableNumber ? [removed.tableNumber] : []);
      for (const tn of removedTables) {
        if (removed.sessionId) {
          await Table.findOneAndUpdate({ number: tn, sessionId: removed.sessionId }, { $set: { status: 'available', sessionId: null, customerName: null, guestCount: null } });
        }
      }

      return res.json({ deleted: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  module.exports = { listReservations, getReservation, createReservation, updateReservation, deleteReservation };
