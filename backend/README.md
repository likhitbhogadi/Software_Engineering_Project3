# MediFlow Prototype Backend

This is the backend implementation for the MediFlow Offline-First Patient Data System. It is built using an Event-Driven Microservices Architecture combined with CQRS.

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **MongoDB** (You can run this locally or via Docker using the provided `docker-compose.yml`)
- **Docker** (Optional, but recommended for running MongoDB easily)

## 1. Environment Setup

Each microservice requires its own `.env` file. You can create them by copying the `.env.example` templates.

Run the following commands from this `backend` directory:

```bash
# Copy the .env.example files for each microservice
cp auth-service/.env.example auth-service/.env
cp sync-service/.env.example sync-service/.env
cp write-service/.env.example write-service/.env
cp read-service/.env.example read-service/.env
```

**Note**: Make sure that the `JWT_SECRET` is exactly the same across all `.env` files so that the microservices can validate each other's tokens.

## 2. Install Dependencies

You need to install the Node modules for the root launcher and all four microservices.
A convenient script is provided to install everything at once:

```bash
# 1. Install root dependencies (like dotenv, nodemon)
npm install

# 2. Install dependencies for all microservices
npm run install:all
```

## 3. Start MongoDB

The backend requires MongoDB to store its data. The `docker-compose.yml` file defines a MongoDB container and network for you.

Start just the MongoDB container in the background:
```bash
docker compose up -d mongo
```
*(Alternatively, you can use your own local MongoDB installation running on `localhost:27017`)*

## 4. Run the Application

Because this prototype relies on an **In-Memory Event Bus (Node EventEmitter)**, all the services need to run within the same Node.js process to share events.

Start the system from this root `backend` directory:

```bash
# For development (auto-restarts on code changes)
npm run dev

# For production/standard run
npm start
```

You should see output indicating all 4 services have started successfully on their respective ports:
- **Auth Service**: `http://localhost:5001`
- **Sync Service**: `http://localhost:5002`
- **Write Service**: `http://localhost:5003`
- **Read Service**: `http://localhost:5004`

## How it works (Prototype Architecture)

1. The `index.js` file loads the environment variables for each service and boots them sequentially.
2. It ensures the **Write Service** and **Read Service** share the exact same `eventBus` instance.
3. When the Write Service receives offline sync data, it saves it and publishes a `PatientDataSynced` event.
4. The Read Service instantly catches this event and updates the fast-query read model.

### Using Docker for all services
If you wish to run the entire stack using Docker (where each microservice runs in its own container), you will need to replace the in-memory `eventBus` with an external message broker like **Apache Kafka** or **RabbitMQ**. The in-memory Event Emitter cannot cross process/container boundaries.
