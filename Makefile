.PHONY: up down logs restart ps clean help up-dev down-dev logs-dev restart-dev ps-dev clean-dev
.DEFAULT_GOAL := help

COMPOSE_FILES := -f compose.yaml -f compose.dev.yaml

up:
	docker compose up -d --build
up-dev:
	docker compose $(COMPOSE_FILES) up -d --build

down:
	docker compose down
down-dev:
	docker compose $(COMPOSE_FILES) down

logs:
	docker compose logs -f
logs-dev:
	docker compose $(COMPOSE_FILES) logs -f

restart:
	docker compose restart
restart-dev:
	docker compose $(COMPOSE_FILES) restart

ps:
	docker compose ps
ps-dev:
	docker compose $(COMPOSE_FILES) ps

clean:
	docker compose down -v --remove-orphans
clean-dev:
	docker compose $(COMPOSE_FILES) down -v --remove-orphans

help:
	@echo "Comandi disponibili:"
	@echo "  make up      - Avvia i container (build e detached)"
	@echo "  make down    - Ferma e rimuove i container"
	@echo "  make logs    - Mostra i log in tempo reale"
	@echo "  make restart - Riavvia i container"
	@echo "  make ps      - Mostra lo stato dei container"
	@echo "  make clean   - Rimuove container, volumi e orphans"
	@echo ""
	@echo "  make up-dev      - Avvia i container in modalità sviluppo (build e detached)"
	@echo "  make down-dev    - Ferma e rimuove i container in modalità sviluppo"
	@echo "  make logs-dev    - Mostra i log in tempo reale in modalità sviluppo"
	@echo "  make restart-dev - Riavvia i container in modalità sviluppo"
	@echo "  make ps-dev      - Mostra lo stato dei container in modalità sviluppo"
	@echo "  make clean-dev   - Rimuove container, volumi e orphans in modalità sviluppo"