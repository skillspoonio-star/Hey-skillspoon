const mongoose = require('mongoose');

const TableActivitySchema = new mongoose.Schema({
  type: { type: String, enum: ['cleaning','maintenance','setup','inspection'], required: true },
  status: { type: String, enum: ['pending','in-progress','completed'], required: true },
  assignedTo: { type: String },
  startTime: { type: Date },
  completedTime: { type: Date },
  notes: { type: String },
  estimatedDuration: { type: Number, required: true },
}, { _id: false });

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true }, 
  status: { type: String, enum: ['available','occupied','cleaning','reserved','maintenance','setup'], default: 'available' },
  // section of the restaurant where the table is located
  section: { type: String, enum: ['main','patio','private','bar'], default: 'main' },
  customerName: { type: String },
  guestCount: { type: Number },
  sessionTime: { type: String },  
  // list of order ObjectIds associated with this table (empty on creation)
  orderIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Order', default: [] },
  // history of session IDs associated with this table (append-only)
  sessionIds: { type: [String], default: [] },
  // reservation price for booking this table (in smallest currency unit, e.g., cents)
  reservationPrice: { type: Number, required: true },
  activities: { type: [TableActivitySchema], default: [] },
  lastCleaned: { type: Date },
  nextMaintenance: { type: Date }, 
}, { timestamps: true });

const Table = mongoose.model('Table', TableSchema);

module.exports = Table;
