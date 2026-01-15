// utils/notifier.js
const Notification = require("../models/Notification");

async function logNotification(userId, message, medicineId, status) {
	try {
		const notif = new Notification({
			user: userId,
			medicineId,
			message,
			status: status || "Upcoming",
			createdAt: new Date(),
		});
		await notif.save();
	} catch (err) {
		// Log but don't throw — notifications should not block main flow
		console.error("❌ logNotification failed:", err);
	}
}

module.exports = { logNotification };
