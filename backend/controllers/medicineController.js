// ...existing code...
const Medicine = require("../models/Medicine");
const { logNotification } = require("../utils/notifier");
const { sendMedicineReminder } = require("../utils/emailHelper");
const User = require("../models/User");
const { scheduleMedicineReminders } = require("../jobs/agendaScheduler");
// Add medicine
exports.addMedicine = async (req, res) => {
  try {
    const { name, type, dosage, time, frequency, notes } = req.body;

    const medicine = new Medicine({
      user: req.userId,
      name,
      type,
      dosage,
      time,
      frequency,
      notes,
      caregivers: [], // caregivers feature disabled
    });

    await medicine.save();

    await logNotification(
      req.userId,
      `Medicine added: ${medicine.name}`,
      medicine._id,
      medicine.status
    );

    const user = await User.findById(req.userId);

    // Send immediate email to registered user only
    let emailFailures = [];
    if (user && user.email) {
      try {
        console.log("📧 Sending 'Added' email to user:", user.email);
        await sendMedicineReminder(user.email, medicine.name, medicine.time, "Added");
        console.log("📧 sendMedicineReminder resolved for user:", user.email);
        // Schedule reminders for user
        try {
          await scheduleMedicineReminders(user.email, medicine);
          console.log("📅 Scheduled reminders for user:", user.email);
        } catch (schedErr) {
          console.error("⚠️ Failed to schedule reminders for user", user.email, schedErr);
        }
      } catch (emailErr) {
        console.error("❌ sendMedicineReminder failed for user:", user.email, emailErr);
        if (emailErr && emailErr.details) emailFailures.push(...emailErr.details);
        else emailFailures.push({ email: user.email, reason: emailErr.message || String(emailErr) });
      }
    } else {
      console.warn("⚠️ No user email found, skipping reminders");
    }

    const response = { medicine };
    if (emailFailures.length) response.emailFailures = emailFailures;
    res.json(response);
  } catch (err) {
    console.error("❌ Error in addMedicine:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get medicines
exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.userId });
    res.json({ medicines });
  } catch (err) {
    console.error("❌ Error in getMedicines:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update medicine
exports.updateMedicine = async (req, res) => {
  try {
    // Fetch current record to detect changes (e.g., newly added caregivers)
    const existing = await Medicine.findById(req.params.id).lean();

    const { name, type, dosage, time, frequency, notes } = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { name, type, dosage, time, frequency, notes },
      { new: true }
    );

    // Caregiver feature disabled: no caregiver notifications

    res.json({ medicine });
  } catch (err) {
    console.error("❌ Error in updateMedicine:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!medicine) return res.status(404).json({ error: "Medicine not found" });


    res.json({ message: "Medicine deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteMedicine:", err);
    res.status(500).json({ error: "Server error" });
  }
};




// // ...existing code...