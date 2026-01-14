// Cleanup script: remove Agenda jobs that have missing or empty recipientEmail
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment');
  process.exit(1);
}

(async () => {
  try {
    // Newer mongoose versions accept no options here; pass URI only
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collName = 'agendaJobs';
    const coll = db.collection(collName);
    console.log('Connected to Mongo. Cleaning', collName);

    const filter = {
      $or: [
        { 'data': { $exists: false } },
        { 'data.recipientEmail': { $exists: false } },
        { 'data.recipientEmail': null },
        { 'data.recipientEmail': '' }
      ]
    };

    const result = await coll.deleteMany(filter);
    console.log('Deleted documents:', result.deletedCount);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning agenda jobs:', err);
    process.exit(2);
  }
})();
