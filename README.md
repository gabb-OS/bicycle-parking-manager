# Bicycle Parking Manager (BPM)

**Smart bike parking manager project for the Context Aware Systems course.**

This project consists of three main orchestrated services:

1.  **Frontend:** Angular application.
2.  **Backend:** Flask (Python) API with PostGIS.
3.  **Database:** PostgreSQL with PostGIS extension.

The architecture is fully dockerized and uses **Nginx** as a reverse proxy gateway.

## How to Run (Makefile)

### Essentials

To build:

```bash
make up
```

To take down containers:

```bash
make down
```

Add a `-dev` to parameter to run in dev mode, for example

```bash
make up-dev
```

For more infos and commands check the `Makefile`

## How to Run (production)

```bash
docker compose up -d --build
```

## How to Run (development)

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

## 🛠 Development Access Points

| Component    | URL                      | Login                   |
| :----------- | :----------------------- | :---------------------- |
| **Main App** | `http://localhost`       | -                       |
| **API**      | `http://localhost/api/`  | -                       |
| **pgAdmin**  | `http://localhost:15432` | -                       |
| **Postgres** | `localhost:5432`         | `postgres` / `postgres` |

## 📡 Routing Logic

Nginx strips the `/api/` prefix.

- Browser: `GET /api/areas/test` (test route)
- Backend receives: `GET /areas/test`