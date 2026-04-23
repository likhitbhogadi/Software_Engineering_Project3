require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const readRoutes = require('./routes/readRoutes');
const { handlePatientDataSynced } = require('./handlers/patientEventHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/patients', readRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'read-service', status: 'ok' }));

/**
 * PROTOTYPE NOTE — In-Process Event Bus Wiring
 * ---------------------------------------------
 * In this prototype, all services run in the same Node.js process (or
 * the eventBus module is shared via require() cache when run together).
 *
 * The Read Service subscribes to the Write Service's eventBus singleton.
 * This works because Node.js caches modules — both services share the
 * same eventBus instance when run in-process (e.g. via a root index.js).
 *
 * PRODUCTION UPGRADE PATH:
 * Replace eventBus.subscribe() below with a Kafka consumer:
 *   const { Kafka } = require('kafkajs');
 *   const kafka = new Kafka({ brokers: ['kafka:9092'] });
 *   const consumer = kafka.consumer({ groupId: 'read-service' });
 *   await consumer.subscribe({ topic: 'PatientDataSynced' });
 *   await consumer.run({ eachMessage: async ({ message }) => {
 *     await handlePatientDataSynced(JSON.parse(message.value.toString()));
 *   }});
 */
const subscribeToEventBus = () => {
  try {
    // Resolve path to write-service eventBus (works when running from repo root)
    const eventBusPath = process.env.WRITE_SERVICE_EVENT_BUS_PATH
      ? path.resolve(process.env.WRITE_SERVICE_EVENT_BUS_PATH)
      : path.resolve(__dirname, '../../write-service/src/eventBus');

    const eventBus = require(eventBusPath);
    eventBus.subscribe('PatientDataSynced', handlePatientDataSynced);
    console.log('Read Service: Subscribed to PatientDataSynced events');
  } catch (err) {
    console.warn(
      'Read Service: Could not connect to Write Service event bus.',
      'If running services separately, use Kafka or an HTTP callback instead.',
      err.message
    );
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Read Service: Connected to MongoDB (patient_read_db)');

    // Subscribe to events AFTER DB is ready
    subscribeToEventBus();

    app.listen(process.env.PORT || 5004, () => {
      console.log(`Read Service running on port ${process.env.PORT || 5004}`);
    });
  })
  .catch((err) => {
    console.error('Read Service: MongoDB connection error:', err.message);
    process.exit(1);
  });
