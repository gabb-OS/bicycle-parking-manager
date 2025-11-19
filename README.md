# Bicycle Parking Manager
Smart bike parking manager project for the Context Aware Systems course

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

Add a ```-dev``` to parameter to run in dev mode, for example
```bash
make up-dev
```

For more infos and commands check the ```Makefile```
## How to Run (production)

```bash
docker compose up -d --build
```

## How to Run (development)

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```
