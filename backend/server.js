const express = require('express');
const dotenv = require('dotenv');
// Load environment variables immediately so modules that read process.env
// (like emailConfig) see the values when they are required.
dotenv.config();
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicine');
const transporter = require('./config/emailConfig');
// backend/app.js or backend/server.js
const notificationsRoute = require('./routes/notifications');
const debugRoute = require('./routes/debug');
const { startAutoMissJob } = require("./jobs/autoMiss");




// Load environment variables first
dotenv.config();
 
const app = express();

// Connect to MongoDB after dotenv is loaded
connectDB();

app.use(cors());
app.use(express.json());
//const { scheduleMedicineReminders } = require("./jobs/medicineScheduler");
const { agenda } = require("./jobs/agendaScheduler");
startAutoMissJob();
app.use('/api/notifications', notificationsRoute);
app.use('/api/auth', authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use('/api/debug', debugRoute);


app.get('/', (req, res) => {
  res.send('Backend running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => { 
  console.log(`🚀 Server running on port ${PORT}`);
  // ✅ Start Agenda explicitly (optional, but good practice)
  await agenda.start(); console.log("📅 Agenda started and ready to process jobs"); 
});
