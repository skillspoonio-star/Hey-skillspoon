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
  status: { type: String, enum: ['available','occupied','cleaning','reserved'], default: 'available' },
  customerName: { type: String },
  guestCount: { type: Number },
  sessionTime: { type: String },
  orderCount: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  sessionId: { type: String },
  activities: { type: [TableActivitySchema], default: [] },
  lastCleaned: { type: Date },
  nextMaintenance: { type: Date }, 
}, { timestamps: true });

const Table = mongoose.model('Table', TableSchema);

module.exports = Table;
