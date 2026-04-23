require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'auth-service', status: 'ok' }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Auth Service: Connected to MongoDB (auth_db)');
    app.listen(process.env.PORT || 5001, () => {
      console.log(`Auth Service running on port ${process.env.PORT || 5001}`);
    });
  })
  .catch((err) => {
    console.error('Auth Service: MongoDB connection error:', err.message);
    process.exit(1);
  });
