require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const writeRoutes = require('./routes/writeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/write', writeRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'write-service', status: 'ok' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Write Service: Connected to MongoDB (patient_write_db)');
    app.listen(process.env.PORT || 5003, () => {
      console.log(`Write Service running on port ${process.env.PORT || 5003}`);
    });
  })
  .catch((err) => {
    console.error('Write Service: MongoDB connection error:', err.message);
    process.exit(1);
  });
