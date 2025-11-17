# Frontend for Bicycle Parking Manager (BPM)

This is the Angular frontend service for the BPM application. It is designed to run with Docker and Docker Compose, communicating with the Flask backend service.

## Prerequisites

Before you begin, ensure you have the following installed:
* **Docker**
* **Docker Compose**

## How to Run

The `docker-compose.yaml` file is configured to set up two services:
* `frontend-bpm-prod`: The Angular frontend, when ready to have a definitive version of the image.
* `frontend-bpm-dev`: The Angular frontend, when still under development, useful to dynamically observe the changes applied to the application, via the `watch` directive.

### Production environment

This single command will build the Angular app image ready for production, and run them in the background with the `-d` parameter.

```bash
docker compose up -d --build frontend-bpm-prod
```
or using multiple commands, differentiating image building from container creation:

```bash
docker compose build frontend-bpm-prod

docker compose up -d frontend-bpm-prod
```

### Development environment

This single command will build the Angular app image ready for development, and run them in the background with the `-d` parameter.

```bash
docker compose up -d --build frontend-bpm-dev
```
or using multiple commands, differentiating image building from container creation:

```bash
docker compose build frontend-bpm-dev

docker compose up -d frontend-bpm-dev
```
