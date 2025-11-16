# Backend for Bicycle Parking Manager (BPM)

This is the Flask backend service for the BPM application. It is designed to run with Docker and Docker Compose, connecting to a PostgreSQL 12 database.

## Prerequisites

Before you begin, ensure you have the following installed:
* **Docker**
* **Docker Compose**

## How to Run

The `docker-compose.yml` file is configured to set up two services:
* `backend-bpm`: The Flask application.
* `backend-bpm_db`: The PostgreSQL 12 database.

### Method 1: Simple (Recommended)

This single command will build the Flask app image, start both the database and the backend service, and run them in the background.

```bash
docker compose up -d --build
```

### Method 2:


```bash
docker compose build

docker compose up backend-bpm_api

docker compose up backend-bpm

```

