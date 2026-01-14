const mongoose = require("mongoose");

const CaregiverSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
  },
});

const MedicineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // link medicine to logged-in user
    required: true,
  },
  name: { type: String, required: true },
  type: { type: String, required: true },
  dosage: { type: String },
  time: { type: String, required: true },
  frequency: { type: String, required: true },
  notes: { type: String },
  caregivers: [CaregiverSchema],
  status: {
    type: String, 
    enum: ["Upcoming", "Taken", "Missed"],
    default: "Upcoming", },          
  statusUpdatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Medicine", MedicineSchema);
