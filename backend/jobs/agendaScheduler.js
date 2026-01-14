// jobs/agendaScheduler.js
const Agenda = require("agenda");
const moment = require("moment-timezone");
const { sendMedicineReminder } = require("../utils/emailHelper");


// Connect Agenda to MongoDB
const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
});

// Define the job
agenda.define("send medicine reminder", async (job) => {
  const { userEmail, caregiverPhone, medicineName, time, label } = job.attrs.data;
  console.log(`📧 Running job: ${medicineName} for ${userEmail || "no email"} at ${time} (${label || "at time"})`);

  try {
    if (userEmail) {
      await sendMedicineReminder(userEmail, medicineName, time);
      console.log("✅ Email sent successfully");
    }

  } catch (err) {
    console.error("❌ Failed to send reminder:", err);
  }
});

// Start Agenda
(async function () {
  await agenda.start();
})();

// Function to schedule reminders
async function scheduleMedicineReminders(userEmail, medicine) {
  // Ensure Agenda is started before scheduling jobs
  try {
    await agenda.start();
  } catch (startErr) {
    // start() may be called elsewhere; log and continue
    console.warn("⚠️ Agenda.start() warning:", startErr && startErr.message ? startErr.message : startErr);
  }

  // Build moments in IST to avoid timezone drift and to compare correctly
  let medicineMoment;
  if (typeof medicine.time === "string" && medicine.time.includes(":")) {
    const [hours, minutes] = medicine.time.split(":").map(Number);
    medicineMoment = moment.tz({ hour: hours, minute: minutes }, "Asia/Kolkata");
  } else {
    medicineMoment = moment.tz(medicine.time, "Asia/Kolkata");
  }

  const now = moment.tz("Asia/Kolkata");
  const reminderMoment = medicineMoment.clone().subtract(30, "minutes");

  const jobData = {
    userEmail,
    medicineName: medicine.name,
    time: medicine.time,
  };

  // If the 30-minute reminder is still in the future, schedule it. If it's
  // already past but the medicine time is still in the future, run an
  // immediate reminder now so the user still gets notified.
  if (reminderMoment.isAfter(now)) {
    await agenda.schedule(reminderMoment.toDate(), "send medicine reminder", jobData);
    console.log(`📅 30‑minute reminder scheduled for ${medicine.name} at ${reminderMoment.format("YYYY-MM-DD HH:mm:ss")} IST`);
  } else if (medicineMoment.isAfter(now)) {
    // The 30-minute mark already passed but medicine time hasn't arrived.
    // Send an immediate reminder via Agenda now (will run the same job handler).
    await agenda.now("send medicine reminder", jobData);
    console.log(`⚠️ 30‑minute mark passed — sending immediate reminder for ${medicine.name} (medicine at ${medicineMoment.format("HH:mm")})`);
  } else {
    console.log(`⚠️ Skipping 30‑minute reminder: ${reminderMoment.format("YYYY-MM-DD HH:mm:ss")} IST is already past`);
  }

  // Schedule exact-time reminder if it's in the future
  if (medicineMoment.isAfter(now)) {
    await agenda.schedule(medicineMoment.toDate(), "send medicine reminder", jobData);
    console.log(`📅 Exact‑time reminder scheduled for ${medicine.name} at ${medicineMoment.format("YYYY-MM-DD HH:mm:ss")} IST`);
  } else {
    console.log(`⚠️ Skipping exact‑time reminder: ${medicineMoment.format("YYYY-MM-DD HH:mm:ss")} IST is already past`);
  }
}

module.exports = { scheduleMedicineReminders, agenda };
