require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const coll = db.collection('agendaJobs');
    console.log('Connected to Mongo. Scanning agendaJobs for legacy email fields...');

    // Find jobs that don't have recipientEmail but might have legacy fields
    const cursor = coll.find({
      data: { $exists: true },
      $or: [
        { 'data.recipientEmail': { $exists: false } },
        { 'data.recipientEmail': null },
        { 'data.recipientEmail': '' }
      ]
    });

    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const d = doc.data || {};
      const possible = d.userEmail || d.email || d.user || d.caregiverEmail || (Array.isArray(d.caregiverEmails) && d.caregiverEmails[0]) || (Array.isArray(d.caregivers) && d.caregivers.find(c => c && c.email) && d.caregivers.find(c => c.email).email);
      if (possible) {
        const email = (typeof possible === 'string') ? possible : (possible.email || possible.toString());
        if (email) {
          await coll.updateOne({ _id: doc._id }, { $set: { 'data.recipientEmail': email } });
          updated++;
          console.log('Updated job', String(doc._id), '-> recipientEmail:', email);
        }
      }
    }

    console.log('Migration complete. Jobs updated:', updated);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing agenda jobs:', err);
    process.exit(2);
  }
})();
