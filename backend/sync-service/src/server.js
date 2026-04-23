require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const syncRoutes = require('./routes/syncRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sync', syncRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'sync-service', status: 'ok' }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Sync Service: Connected to MongoDB (sync_db)');
    app.listen(process.env.PORT || 5002, () => {
      console.log(`Sync Service running on port ${process.env.PORT || 5002}`);
    });
  })
  .catch((err) => {
    console.error('Sync Service: MongoDB connection error:', err.message);
    process.exit(1);
  });
