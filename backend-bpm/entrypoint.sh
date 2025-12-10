#!/bin/sh

# Stop on error
set -e

# 1. Always try to upgrade the DB (Safe: if no new migrations, it does nothing)
echo "Checking for database migrations..."
flask db upgrade

# 2. Seed the database (Idempotent: safe to run every time)
echo "Seeding database..."
flask seed-db

# 2. Execute the command passed to the container
# In Prod: This will be "gunicorn ..."
# In Dev:  This will be "flask run ..."
echo "Starting application..."
exec "$@"